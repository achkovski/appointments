import db from '../config/database.js';
import { appointments, services, businesses, employees } from '../config/schema.js';
import { eq, and, gte, lte, desc, sql, isNull } from 'drizzle-orm';
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

    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);
    const end = endDate ? endDate : null;

    const whereConditions = [
      eq(appointments.businessId, businessId),
      gte(appointments.appointmentDate, start),
    ];

    if (end) {
      whereConditions.push(lte(appointments.appointmentDate, end));
    }

    // Single query with conditional counts instead of fetching all rows
    const result = await db
      .select({
        totalAppointments: sql`count(*)`.mapWith(Number),
        confirmedAppointments: sql`count(*) filter (where ${appointments.status} = 'CONFIRMED')`.mapWith(Number),
        completedAppointments: sql`count(*) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
        cancelledAppointments: sql`count(*) filter (where ${appointments.status} = 'CANCELLED')`.mapWith(Number),
        pendingAppointments: sql`count(*) filter (where ${appointments.status} = 'PENDING')`.mapWith(Number),
        noShows: sql`count(*) filter (where ${appointments.status} = 'NO_SHOW')`.mapWith(Number),
      })
      .from(appointments)
      .where(and(...whereConditions));

    const stats = result[0];
    const total = stats.totalAppointments;

    const noShowRate = total > 0 ? ((stats.noShows / total) * 100).toFixed(1) : 0;
    const cancellationRate = total > 0 ? ((stats.cancelledAppointments / total) * 100).toFixed(1) : 0;
    const completionRate = total > 0 ? ((stats.completedAppointments / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalAppointments: total,
          confirmedAppointments: stats.confirmedAppointments,
          completedAppointments: stats.completedAppointments,
          cancelledAppointments: stats.cancelledAppointments,
          pendingAppointments: stats.pendingAppointments,
          noShows: stats.noShows,
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

    const end = endDate ? endDate : getTodayStr(businessTimezone);
    const start = startDate ? startDate : getDaysAgoStr(businessTimezone, 30);

    // Dynamic date expression based on groupBy param
    let dateExpr;
    if (groupBy === 'week') {
      // Sunday-based week start to match original JS getDay() behavior
      dateExpr = sql`(${appointments.appointmentDate} - extract(dow from ${appointments.appointmentDate})::integer)::text`;
    } else if (groupBy === 'month') {
      dateExpr = sql`to_char(date_trunc('month', ${appointments.appointmentDate}::timestamp), 'YYYY-MM-DD')`;
    } else {
      dateExpr = sql`${appointments.appointmentDate}::text`;
    }

    // Single grouped query with conditional counts
    const trends = await db
      .select({
        date: dateExpr,
        total: sql`count(*)`.mapWith(Number),
        confirmed: sql`count(*) filter (where ${appointments.status} = 'CONFIRMED')`.mapWith(Number),
        completed: sql`count(*) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
        cancelled: sql`count(*) filter (where ${appointments.status} = 'CANCELLED')`.mapWith(Number),
        pending: sql`count(*) filter (where ${appointments.status} = 'PENDING')`.mapWith(Number),
        noShow: sql`count(*) filter (where ${appointments.status} = 'NO_SHOW')`.mapWith(Number),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .groupBy(dateExpr)
      .orderBy(dateExpr);

    res.json({
      success: true,
      data: {
        trends,
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

    // GROUP BY day-of-week with conditional counts
    const rows = await db
      .select({
        dayIndex: sql`extract(dow from ${appointments.appointmentDate})::integer`.mapWith(Number),
        total: sql`count(*)`.mapWith(Number),
        confirmed: sql`count(*) filter (where ${appointments.status} = 'CONFIRMED')`.mapWith(Number),
        completed: sql`count(*) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .groupBy(sql`extract(dow from ${appointments.appointmentDate})`);

    // Build full 7-day array (SQL only returns days with data)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = dayNames.map((name, index) => ({
      day: name,
      dayIndex: index,
      total: 0,
      confirmed: 0,
      completed: 0,
    }));

    rows.forEach(row => {
      dayStats[row.dayIndex].total = row.total;
      dayStats[row.dayIndex].confirmed = row.confirmed;
      dayStats[row.dayIndex].completed = row.completed;
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

    // GROUP BY hour with conditional counts
    const rows = await db
      .select({
        hour: sql`extract(hour from ${appointments.startTime})::integer`.mapWith(Number),
        total: sql`count(*)`.mapWith(Number),
        confirmed: sql`count(*) filter (where ${appointments.status} = 'CONFIRMED')`.mapWith(Number),
        completed: sql`count(*) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .groupBy(sql`extract(hour from ${appointments.startTime})`);

    // Build full 24-hour array (SQL only returns hours with data)
    const hourStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${String(i).padStart(2, '0')}:00`,
      total: 0,
      confirmed: 0,
      completed: 0,
    }));

    rows.forEach(row => {
      if (row.hour >= 0 && row.hour < 24) {
        hourStats[row.hour].total = row.total;
        hourStats[row.hour].confirmed = row.confirmed;
        hourStats[row.hour].completed = row.completed;
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

    // Single query: LEFT JOIN appointments onto services with date filter in JOIN condition
    const rows = await db
      .select({
        serviceId: services.id,
        serviceName: services.name,
        price: services.price,
        totalBookings: sql`count(${appointments.id})`.mapWith(Number),
        completedBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
        cancelledBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'CANCELLED')`.mapWith(Number),
      })
      .from(services)
      .leftJoin(appointments, and(
        eq(appointments.serviceId, services.id),
        eq(appointments.businessId, businessId),
        gte(appointments.appointmentDate, start),
        lte(appointments.appointmentDate, end)
      ))
      .where(eq(services.businessId, businessId))
      .groupBy(services.id, services.name, services.price)
      .orderBy(desc(sql`count(${appointments.id})`));

    const serviceStats = rows.map(row => ({
      serviceId: row.serviceId,
      serviceName: row.serviceName,
      totalBookings: row.totalBookings,
      completedBookings: row.completedBookings,
      cancelledBookings: row.cancelledBookings,
      revenue: row.completedBookings * (parseFloat(row.price) || 0),
    }));

    const totalRevenue = serviceStats.reduce((sum, s) => sum + s.revenue, 0);

    res.json({
      success: true,
      data: {
        serviceStats,
        totalRevenue,
        mostPopularService: serviceStats[0]?.serviceName || 'N/A',
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

    // Single query: employees LEFT JOIN appointments LEFT JOIN services
    // Replaces 3 separate queries + O(n*m) nested .filter() loops
    const rows = await db
      .select({
        employeeId: employees.id,
        employeeName: employees.name,
        isActive: employees.isActive,
        totalBookings: sql`count(${appointments.id})`.mapWith(Number),
        completedBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
        cancelledBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'CANCELLED')`.mapWith(Number),
        noShowBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'NO_SHOW')`.mapWith(Number),
        pendingBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'PENDING')`.mapWith(Number),
        confirmedBookings: sql`count(${appointments.id}) filter (where ${appointments.status} = 'CONFIRMED')`.mapWith(Number),
        revenue: sql`coalesce(sum(case when ${appointments.status} = 'COMPLETED' then coalesce(${services.price}, 0) else 0 end), 0)`.mapWith(Number),
      })
      .from(employees)
      .leftJoin(appointments, and(
        eq(appointments.employeeId, employees.id),
        eq(appointments.businessId, businessId),
        gte(appointments.appointmentDate, start),
        lte(appointments.appointmentDate, end)
      ))
      .leftJoin(services, eq(services.id, appointments.serviceId))
      .where(eq(employees.businessId, businessId))
      .groupBy(employees.id, employees.name, employees.isActive)
      .orderBy(desc(sql`count(${appointments.id})`));

    const employeeStats = rows.map(row => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      isActive: row.isActive,
      totalBookings: row.totalBookings,
      completedBookings: row.completedBookings,
      cancelledBookings: row.cancelledBookings,
      noShowBookings: row.noShowBookings,
      pendingBookings: row.pendingBookings,
      confirmedBookings: row.confirmedBookings,
      completionRate: row.totalBookings > 0 ? ((row.completedBookings / row.totalBookings) * 100).toFixed(1) : 0,
      cancellationRate: row.totalBookings > 0 ? ((row.cancelledBookings / row.totalBookings) * 100).toFixed(1) : 0,
      noShowRate: row.totalBookings > 0 ? ((row.noShowBookings / row.totalBookings) * 100).toFixed(1) : 0,
      revenue: row.revenue,
    }));

    // Unassigned appointments (employee_id IS NULL)
    const unassignedResult = await db
      .select({
        totalBookings: sql`count(*)`.mapWith(Number),
        completedBookings: sql`count(*) filter (where ${appointments.status} = 'COMPLETED')`.mapWith(Number),
        revenue: sql`coalesce(sum(case when ${appointments.status} = 'COMPLETED' then coalesce(${services.price}, 0) else 0 end), 0)`.mapWith(Number),
      })
      .from(appointments)
      .leftJoin(services, eq(services.id, appointments.serviceId))
      .where(and(
        eq(appointments.businessId, businessId),
        isNull(appointments.employeeId),
        gte(appointments.appointmentDate, start),
        lte(appointments.appointmentDate, end)
      ));

    const unassigned = unassignedResult[0];
    const totalRevenue = employeeStats.reduce((sum, e) => sum + e.revenue, 0) + unassigned.revenue;

    res.json({
      success: true,
      data: {
        employeeStats,
        unassigned: {
          totalBookings: unassigned.totalBookings,
          completedBookings: unassigned.completedBookings,
          revenue: unassigned.revenue,
        },
        totalRevenue,
        topPerformer: employeeStats[0]?.employeeName || 'N/A',
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

    // Aggregated client stats in date range (replaces fetching all individual rows)
    const clientRows = await db
      .select({
        clientEmail: appointments.clientEmail,
        name: sql`trim(concat(max(${appointments.clientFirstName}), ' ', max(${appointments.clientLastName})))`,
        visits: sql`count(*)`.mapWith(Number),
        totalSpent: sql`coalesce(sum(case when ${appointments.status} = 'COMPLETED' then coalesce(${services.price}, 0) else 0 end), 0)`.mapWith(Number),
        lastVisitDate: sql`max(${appointments.appointmentDate})`,
      })
      .from(appointments)
      .leftJoin(services, eq(services.id, appointments.serviceId))
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .groupBy(appointments.clientEmail);

    // Get first-ever visit per client via MIN aggregate (replaces fetching ALL rows unbounded)
    const firstVisitRows = await db
      .select({
        clientEmail: appointments.clientEmail,
        firstVisit: sql`min(${appointments.appointmentDate})`,
      })
      .from(appointments)
      .where(eq(appointments.businessId, businessId))
      .groupBy(appointments.clientEmail);

    const firstVisitMap = {};
    firstVisitRows.forEach(row => {
      if (row.clientEmail) {
        firstVisitMap[row.clientEmail] = row.firstVisit;
      }
    });

    // Filter out null emails
    const clients = clientRows.filter(c => c.clientEmail);
    const totalUniqueClients = clients.length;

    // New vs returning
    let newClients = 0;
    let returningClients = 0;
    clients.forEach(client => {
      const firstVisit = firstVisitMap[client.clientEmail];
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
    const totalAppointmentsInRange = clients.reduce((sum, c) => sum + c.visits, 0);
    const avgBookingsPerClient = totalUniqueClients > 0
      ? parseFloat((totalAppointmentsInRange / totalUniqueClients).toFixed(1))
      : 0;

    // Top 10 clients by visits
    const topClients = clients
      .map(c => ({
        name: c.name,
        email: c.clientEmail,
        visits: c.visits,
        totalSpent: c.totalSpent,
        lastVisitDate: c.lastVisitDate,
      }))
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

    // Date expression for grouping
    let dateExpr;
    if (groupBy === 'week') {
      dateExpr = sql`(${appointments.appointmentDate} - extract(dow from ${appointments.appointmentDate})::integer)::text`;
    } else if (groupBy === 'month') {
      dateExpr = sql`to_char(date_trunc('month', ${appointments.appointmentDate}::timestamp), 'YYYY-MM-DD')`;
    } else {
      dateExpr = sql`${appointments.appointmentDate}::text`;
    }

    // Revenue trend: JOIN services for price, GROUP BY date
    const rows = await db
      .select({
        date: dateExpr,
        revenue: sql`coalesce(sum(${services.price}), 0)`.mapWith(Number),
        count: sql`count(*)`.mapWith(Number),
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.status, 'COMPLETED'),
          gte(appointments.appointmentDate, start),
          lte(appointments.appointmentDate, end)
        )
      )
      .groupBy(dateExpr)
      .orderBy(dateExpr);

    const revenueTrend = rows.map(r => ({
      ...r,
      revenue: parseFloat(r.revenue.toFixed(2)),
    }));

    // Summary stats
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
    const totalCompletedAppointments = rows.reduce((sum, r) => sum + r.count, 0);
    const daysInRange = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1);

    // Period comparison
    const periodDays = daysInRange;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - periodDays + 1);

    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    // Single aggregate for previous period revenue (replaces fetching all rows + JS reduce)
    const prevResult = await db
      .select({
        totalRevenue: sql`coalesce(sum(${services.price}), 0)`.mapWith(Number),
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.status, 'COMPLETED'),
          gte(appointments.appointmentDate, prevStartStr),
          lte(appointments.appointmentDate, prevEndStr)
        )
      );

    const previousRevenue = prevResult[0].totalRevenue;

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
    });
  }
};
