import db from '../config/database.js';
import { appointments, services, businesses, employees } from '../config/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

// Helper function to get business ID for current user
const getBusinessIdForUser = async (userId) => {
  const business = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerId, userId))
    .limit(1);

  return business[0]?.id || null;
};

// Get analytics overview for a business
export const getAnalyticsOverview = async (req, res) => {
  try {
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    // Note: We don't restrict by endDate to include future appointments that may be cancelled/no-show
    const start = startDate ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Default to last 30 days
    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate } = req.query;

    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
    const businessId = await getBusinessIdForUser(req.user.id);

    if (!businessId) {
      return res.status(404).json({
        success: false,
        message: 'Business not found for this user',
      });
    }

    const { startDate, endDate, type = 'appointments' } = req.query;

    const end = endDate ? endDate : new Date().toISOString().split('T')[0];
    const start = startDate ? startDate : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
