import db from '../config/database.js';
import { appointments, services, businesses, employees } from '../config/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { nowInTimezone } from '../utils/timezone.js';

// Helper function to get business ID and timezone for current user
const getBusinessForUser = async (userId) => {
  const business = await db
    .select({ id: businesses.id, timezone: businesses.timezone })
    .from(businesses)
    .where(eq(businesses.ownerId, userId))
    .limit(1);

  return business[0] || null;
};

// Helper to get today's date string in business timezone
const getTodayStr = (timezone) => {
  const { date } = nowInTimezone(timezone || 'Europe/Skopje');
  return date;
};

// Helper to get a date N days ago in business timezone
const getDaysAgoStr = (timezone, days) => {
  const todayStr = getTodayStr(timezone);
  const [y, m, d] = todayStr.split('-').map(Number);
  const past = new Date(Date.UTC(y, m - 1, d - days));
  return past.toISOString().split('T')[0];
};

// Get analytics overview for a business
export const getAnalyticsOverview = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    // Note: We don't restrict by endDate to include future appointments that may be cancelled/no-show
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);
    const end = endDate ? endDate : null; // null means no upper limit

    // Get all appointments from start date onwards (including future appointments)
    // This ensures cancelled/no-show future appointments are counted in statistics
    const whereConditions = [
      eq(appointments.businessId, businessId),
      gte(appointments.appointmentDate, start),
    ];

    // Only add end date filter if explicitly provided
    if (end) {
      whereConditions.push(lte(appointments.appointmentDate, end));
    }

    const appointmentData = await db
      .select({
        id: appointments.id,
        status: appointments.status,
        appointmentDate: appointments.appointmentDate,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        serviceId: appointments.serviceId,
      })
      .from(appointments)
      .where(and(...whereConditions));

    // Calculate statistics
    const totalAppointments = appointmentData.length;
    const confirmedAppointments = appointmentData.filter(a => a.status === 'CONFIRMED').length;
    const completedAppointments = appointmentData.filter(a => a.status === 'COMPLETED').length;
    const cancelledAppointments = appointmentData.filter(a => a.status === 'CANCELLED').length;
    const pendingAppointments = appointmentData.filter(a => a.status === 'PENDING').length;

    // Calculate no-show rate
    const noShows = appointmentData.filter(a => a.status === 'NO_SHOW').length;
    const noShowRate = totalAppointments > 0 ? ((noShows / totalAppointments) * 100).toFixed(1) : 0;

    // Calculate cancellation rate
    const cancellationRate = totalAppointments > 0 ? ((cancelledAppointments / totalAppointments) * 100).toFixed(1) : 0;

    // Calculate completion rate
    const completionRate = totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalAppointments,
          confirmedAppointments,
          completedAppointments,
          cancelledAppointments,
          pendingAppointments,
          noShows,
          noShowRate: parseFloat(noShowRate),
          cancellationRate: parseFloat(cancellationRate),
          completionRate: parseFloat(completionRate),
        },
        dateRange: {
          start,
          end: end || 'all future',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error.message,
    });
  }
};

// Get booking trends (daily/weekly/monthly)
export const getBookingTrends = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Default to last 30 days
    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Get appointments within date range
    const appointmentData = await db
      .select({
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .orderBy(appointments.appointmentDate);

    // Group by date
    const trends = {};
    appointmentData.forEach(appointment => {
      const date = new Date(appointment.appointmentDate);
      let key;

      if (groupBy === 'week') {
        // Get start of week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        // Get year-month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      } else {
        // Default to day
        key = appointment.appointmentDate;
      }

      if (!trends[key]) {
        trends[key] = {
          date: key,
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          noShow: 0,
        };
      }

      trends[key].total++;
      if (appointment.status === 'CONFIRMED') trends[key].confirmed++;
      if (appointment.status === 'COMPLETED') trends[key].completed++;
      if (appointment.status === 'CANCELLED') trends[key].cancelled++;
      if (appointment.status === 'PENDING') trends[key].pending++;
      if (appointment.status === 'NO_SHOW') trends[key].noShow++;
    });

    // Convert to array and sort
    const trendsArray = Object.values(trends).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    res.json({
      success: true,
      data: {
        trends: trendsArray,
        groupBy,
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching booking trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking trends',
      error: error.message,
    });
  }
};

// Get popular days of week
export const getPopularDays = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 90);

    const appointmentData = await db
      .select({
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );

    // Group by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = dayNames.map((name, index) => ({
      day: name,
      dayIndex: index,
      total: 0,
      confirmed: 0,
      completed: 0,
    }));

    appointmentData.forEach(appointment => {
      const date = new Date(appointment.appointmentDate);
      const dayIndex = date.getDay();
      dayStats[dayIndex].total++;
      if (appointment.status === 'CONFIRMED') dayStats[dayIndex].confirmed++;
      if (appointment.status === 'COMPLETED') dayStats[dayIndex].completed++;
    });

    // Sort by total bookings
    const sortedDays = [...dayStats].sort((a, b) => b.total - a.total);
    const mostPopularDay = sortedDays[0]?.total > 0 ? sortedDays[0].day : 'N/A';

    res.json({
      success: true,
      data: {
        dayStats,
        mostPopularDay,
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching popular days:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular days',
      error: error.message,
    });
  }
};

// Get popular time slots
export const getPopularTimeSlots = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 90);

    const appointmentData = await db
      .select({
        startTime: appointments.startTime,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );

    // Group by hour
    const hourStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${String(i).padStart(2, '0')}:00`,
      total: 0,
      confirmed: 0,
      completed: 0,
    }));

    appointmentData.forEach(appointment => {
      // startTime is a time string like "09:00:00"
      const hour = parseInt(appointment.startTime.split(':')[0], 10);
      if (hour >= 0 && hour < 24) {
        hourStats[hour].total++;
        if (appointment.status === 'CONFIRMED') hourStats[hour].confirmed++;
        if (appointment.status === 'COMPLETED') hourStats[hour].completed++;
      }
    });

    // Filter out hours with no bookings and sort
    const activeHours = hourStats.filter(h => h.total > 0).sort((a, b) => b.total - a.total);
    const peakHour = activeHours[0]?.hourLabel || 'N/A';

    res.json({
      success: true,
      data: {
        hourStats: hourStats.filter(h => h.total > 0), // Only return hours with bookings
        allHourStats: hourStats, // Return all hours for chart
        peakHour,
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching popular time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular time slots',
      error: error.message,
    });
  }
};

// Get service performance
export const getServicePerformance = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Get all services
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId));

    // Get appointments with service info
    const appointmentData = await db
      .select({
        serviceId: appointments.serviceId,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );

    // Calculate stats per service
    const serviceStats = allServices.map(service => {
      const serviceAppointments = appointmentData.filter(a => a.serviceId === service.id);
      const total = serviceAppointments.length;
      const completed = serviceAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = serviceAppointments.filter(a => a.status === 'CANCELLED').length;

      return {
        serviceId: service.id,
        serviceName: service.name,
        totalBookings: total,
        completedBookings: completed,
        cancelledBookings: cancelled,
        revenue: completed * (parseFloat(service.price) || 0),
      };
    });

    // Sort by total bookings
    const sortedServices = serviceStats.sort((a, b) => b.totalBookings - a.totalBookings);
    const totalRevenue = serviceStats.reduce((sum, s) => sum + s.revenue, 0);

    res.json({
      success: true,
      data: {
        serviceStats: sortedServices,
        totalRevenue,
        mostPopularService: sortedServices[0]?.serviceName || 'N/A',
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching service performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service performance',
      error: error.message,
    });
  }
};

// Get employee performance
export const getEmployeePerformance = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Get all employees
    const allEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.businessId, businessId));

    // Get appointments with employee info
    const appointmentData = await db
      .select({
        employeeId: appointments.employeeId,
        status: appointments.status,
        serviceId: appointments.serviceId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );

    // Get services for price lookup
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId));

    const serviceMap = {};
    allServices.forEach(s => {
      serviceMap[s.id] = s;
    });

    // Calculate stats per employee
    const employeeStats = allEmployees.map(employee => {
      const employeeAppointments = appointmentData.filter(a => a.employeeId === employee.id);
      const total = employeeAppointments.length;
      const completed = employeeAppointments.filter(a => a.status === 'COMPLETED').length;
      const cancelled = employeeAppointments.filter(a => a.status === 'CANCELLED').length;
      const noShow = employeeAppointments.filter(a => a.status === 'NO_SHOW').length;
      const pending = employeeAppointments.filter(a => a.status === 'PENDING').length;
      const confirmed = employeeAppointments.filter(a => a.status === 'CONFIRMED').length;

      // Calculate revenue from completed appointments
      const revenue = employeeAppointments
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => {
          const service = serviceMap[a.serviceId];
          return sum + (parseFloat(service?.price) || 0);
        }, 0);

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        isActive: employee.isActive,
        totalBookings: total,
        completedBookings: completed,
        cancelledBookings: cancelled,
        noShowBookings: noShow,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
        cancellationRate: total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0,
        noShowRate: total > 0 ? ((noShow / total) * 100).toFixed(1) : 0,
        revenue,
      };
    });

    // Also calculate "unassigned" stats
    const unassignedAppointments = appointmentData.filter(a => !a.employeeId);
    const unassignedTotal = unassignedAppointments.length;
    const unassignedCompleted = unassignedAppointments.filter(a => a.status === 'COMPLETED').length;
    const unassignedRevenue = unassignedAppointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => {
        const service = serviceMap[a.serviceId];
        return sum + (parseFloat(service?.price) || 0);
      }, 0);

    // Sort by total bookings
    const sortedEmployees = employeeStats.sort((a, b) => b.totalBookings - a.totalBookings);
    const totalRevenue = employeeStats.reduce((sum, e) => sum + e.revenue, 0) + unassignedRevenue;

    res.json({
      success: true,
      data: {
        employeeStats: sortedEmployees,
        unassigned: {
          totalBookings: unassignedTotal,
          completedBookings: unassignedCompleted,
          revenue: unassignedRevenue,
        },
        totalRevenue,
        topPerformer: sortedEmployees[0]?.employeeName || 'N/A',
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance',
      error: error.message,
    });
  }
};

// Export analytics data as CSV
export const exportAnalytics = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate, type = 'appointments', format } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    if (type === 'appointments') {
      const appointmentData = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.businessId, businessId),
            gte(appointments.appointmentDate, start),
            lte(appointments.appointmentDate, end)
          )
        )
        .orderBy(desc(appointments.appointmentDate));

      // Return JSON if format=json is requested (used by report preview)
      if (format === 'json') {
        // Get services for name lookup
        const allServices = await db
          .select()
          .from(services)
          .where(eq(services.businessId, businessId));

        const serviceMap = {};
        allServices.forEach(s => { serviceMap[s.id] = s; });

        // Get employees for name lookup
        const allEmployees = await db
          .select()
          .from(employees)
          .where(eq(employees.businessId, businessId));

        const employeeMap = {};
        allEmployees.forEach(e => { employeeMap[e.id] = e; });

        const enrichedData = appointmentData.map(a => ({
          id: a.id,
          clientFirstName: a.clientFirstName || '',
          clientLastName: a.clientLastName || '',
          clientEmail: a.clientEmail || '',
          clientPhone: a.clientPhone || '',
          serviceName: serviceMap[a.serviceId]?.name || 'Unknown',
          employeeName: a.employeeId ? (employeeMap[a.employeeId]?.name || 'Unknown') : '',
          appointmentDate: a.appointmentDate,
          startTime: a.startTime,
          endTime: a.endTime,
          status: a.status,
          notes: a.notes || '',
          createdAt: a.createdAt,
        }));

        return res.json({
          success: true,
          data: {
            appointments: enrichedData,
            total: enrichedData.length,
            dateRange: { start, end },
          },
        });
      }

      // Convert to CSV
      const headers = ['ID', 'Client First Name', 'Client Last Name', 'Client Email', 'Client Phone', 'Service ID', 'Date', 'Start Time', 'End Time', 'Status', 'Notes', 'Created At'];
      const csvRows = [headers.join(',')];

      appointmentData.forEach(appointment => {
        const row = [
          appointment.id,
          `"${appointment.clientFirstName || ''}"`,
          `"${appointment.clientLastName || ''}"`,
          appointment.clientEmail || '',
          appointment.clientPhone || '',
          appointment.serviceId || '',
          appointment.appointmentDate,
          appointment.startTime,
          appointment.endTime,
          appointment.status,
          `"${(appointment.notes || '').replace(/"/g, '""')}"`,
          appointment.createdAt,
        ];
        csvRows.push(row.join(','));
      });

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="appointments-${start}-to-${end}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid export type',
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message,
    });
  }
};

// Get client analytics
export const getClientAnalytics = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Get appointments in date range
    const appointmentData = await db
      .select({
        clientEmail: appointments.clientEmail,
        clientFirstName: appointments.clientFirstName,
        clientLastName: appointments.clientLastName,
        appointmentDate: appointments.appointmentDate,
        status: appointments.status,
        serviceId: appointments.serviceId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      );

    // Get ALL appointments (no date filter) to find each client's first-ever visit
    const allAppointments = await db
      .select({
        clientEmail: appointments.clientEmail,
        appointmentDate: appointments.appointmentDate,
      })
      .from(appointments)
      .where(eq(appointments.businessId, businessId));

    // Build first-visit map
    const firstVisitMap = {};
    allAppointments.forEach(a => {
      const email = a.clientEmail;
      if (!email) return;
      if (!firstVisitMap[email] || a.appointmentDate < firstVisitMap[email]) {
        firstVisitMap[email] = a.appointmentDate;
      }
    });

    // Get services for price lookup
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId));

    const serviceMap = {};
    allServices.forEach(s => { serviceMap[s.id] = s; });

    // Group by client email
    const clientMap = {};
    appointmentData.forEach(a => {
      const email = a.clientEmail;
      if (!email) return;
      if (!clientMap[email]) {
        clientMap[email] = {
          name: `${a.clientFirstName || ''} ${a.clientLastName || ''}`.trim(),
          email,
          visits: 0,
          totalSpent: 0,
          lastVisitDate: a.appointmentDate,
        };
      }
      clientMap[email].visits++;
      if (a.status === 'COMPLETED') {
        clientMap[email].totalSpent += parseFloat(serviceMap[a.serviceId]?.price) || 0;
      }
      if (a.appointmentDate > clientMap[email].lastVisitDate) {
        clientMap[email].lastVisitDate = a.appointmentDate;
      }
    });

    const clients = Object.values(clientMap);
    const totalUniqueClients = clients.length;

    // New vs returning
    let newClients = 0;
    let returningClients = 0;
    clients.forEach(client => {
      const firstVisit = firstVisitMap[client.email];
      if (firstVisit && firstVisit >= start && firstVisit <= end) {
        newClients++;
      } else {
        returningClients++;
      }
    });

    // Retention rate (clients with > 1 booking in period)
    const repeatClients = clients.filter(c => c.visits > 1).length;
    const retentionRate = totalUniqueClients > 0
      ? parseFloat(((repeatClients / totalUniqueClients) * 100).toFixed(1))
      : 0;

    // Average bookings per client
    const totalAppointmentsInRange = appointmentData.filter(a => a.clientEmail).length;
    const avgBookingsPerClient = totalUniqueClients > 0
      ? parseFloat((totalAppointmentsInRange / totalUniqueClients).toFixed(1))
      : 0;

    // Top 10 clients by visits
    const topClients = clients
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        newClients,
        returningClients,
        totalUniqueClients,
        retentionRate,
        avgBookingsPerClient,
        topClients,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    console.error('Error fetching client analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client analytics',
      error: error.message,
    });
  }
};

// Get revenue over time
export const getRevenueOverTime = async (req, res) => {
  try {
    const businessInfo = await getBusinessForUser(req.user.id);

    if (!businessInfo) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const businessId = businessInfo.id;
    const businessTimezone = businessInfo.timezone || 'Europe/Skopje';

    const { startDate, endDate, groupBy = 'day' } = req.query;

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Get COMPLETED appointments in the date range
    const completedAppointments = await db
      .select({
        appointmentDate: appointments.appointmentDate,
        serviceId: appointments.serviceId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.status, 'COMPLETED'),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .orderBy(appointments.appointmentDate);

    // Get services for price lookup
    const allServices = await db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId));

    const serviceMap = {};
    allServices.forEach(s => { serviceMap[s.id] = s; });

    // Group revenue by period
    const revenueBuckets = {};
    completedAppointments.forEach(a => {
      const date = new Date(a.appointmentDate);
      let key;

      if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      } else {
        key = a.appointmentDate;
      }

      if (!revenueBuckets[key]) {
        revenueBuckets[key] = { date: key, revenue: 0, count: 0 };
      }
      revenueBuckets[key].revenue += parseFloat(serviceMap[a.serviceId]?.price) || 0;
      revenueBuckets[key].count++;
    });

    const revenueTrend = Object.values(revenueBuckets)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(r => ({ ...r, revenue: parseFloat(r.revenue.toFixed(2)) }));

    // Summary stats
    const totalRevenue = completedAppointments.reduce((sum, a) => {
      return sum + (parseFloat(serviceMap[a.serviceId]?.price) || 0);
    }, 0);
    const totalCompletedAppointments = completedAppointments.length;
    const daysInRange = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);

    // Period comparison
    const periodDays = daysInRange;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - periodDays + 1);

    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    const prevAppointments = await db
      .select({
        serviceId: appointments.serviceId,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.status, 'COMPLETED'),
          gte(appointments.appointmentDate, prevStartStr),
          lte(appointments.appointmentDate, prevEndStr)
        )
      );

    const previousRevenue = prevAppointments.reduce((sum, a) => {
      return sum + (parseFloat(serviceMap[a.serviceId]?.price) || 0);
    }, 0);

    const revenueChange = totalRevenue - previousRevenue;
    const revenueChangePercent = previousRevenue > 0
      ? parseFloat(((revenueChange / previousRevenue) * 100).toFixed(1))
      : null;

    res.json({
      success: true,
      data: {
        revenueTrend,
        summary: {
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalCompletedAppointments,
          avgRevenuePerAppointment: totalCompletedAppointments > 0
            ? parseFloat((totalRevenue / totalCompletedAppointments).toFixed(2))
            : 0,
          avgRevenuePerDay: parseFloat((totalRevenue / daysInRange).toFixed(2)),
          daysInRange,
        },
        comparison: {
          currentRevenue: parseFloat(totalRevenue.toFixed(2)),
          previousRevenue: parseFloat(previousRevenue.toFixed(2)),
          revenueChange: parseFloat(revenueChange.toFixed(2)),
          revenueChangePercent,
        },
        groupBy,
        dateRange: { start, end },
      },
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message,
    });
  }
};
