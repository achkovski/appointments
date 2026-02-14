import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useBusiness } from '../../context/BusinessContext';
import {
  getAnalyticsOverview,
  getBookingTrends,
  getPopularDays,
  getPopularTimeSlots,
  getServicePerformance,
  getEmployeePerformance,
  getClientAnalytics,
  getRevenueOverTime,
  getAppointmentList,
} from '../../services/analyticsService';

export default function ReportPreview() {
  const [searchParams] = useSearchParams();
  const { business } = useBusiness();

  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const sections = (searchParams.get('sections') || '').split(',').filter(Boolean);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  const params = { startDate, endDate };

  const fetchData = useCallback(async () => {
    if (!business?.id || sections.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const fetchers = {};

      if (sections.includes('summary')) {
        fetchers.overview = getAnalyticsOverview(params);
      }
      if (sections.includes('trends')) {
        fetchers.trends = getBookingTrends({ ...params, groupBy: 'day' });
      }
      if (sections.includes('services')) {
        fetchers.services = getServicePerformance(params);
      }
      if (sections.includes('employees')) {
        fetchers.employees = getEmployeePerformance(params);
      }
      if (sections.includes('popular')) {
        fetchers.days = getPopularDays(params);
        fetchers.times = getPopularTimeSlots(params);
      }
      if (sections.includes('clients')) {
        fetchers.clients = getClientAnalytics(params);
      }
      if (sections.includes('revenue')) {
        fetchers.revenue = getRevenueOverTime({ ...params, groupBy: 'day' });
      }
      if (sections.includes('appointments')) {
        fetchers.appointments = getAppointmentList(params);
      }

      const keys = Object.keys(fetchers);
      const results = await Promise.all(Object.values(fetchers));

      const resolved = {};
      keys.forEach((key, i) => {
        if (results[i].success) {
          resolved[key] = results[i].data;
        }
      });

      setData(resolved);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [business?.id, startDate, endDate, sections.join(',')]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  // Derive appointment insights from raw data
  const getAppointmentInsights = () => {
    if (!data.appointments?.appointments) return null;

    const appts = data.appointments.appointments;
    if (appts.length === 0) return null;

    // Status breakdown
    const statusCounts = {};
    appts.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count, percentage: ((count / appts.length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);

    // Recent cancellations & no-shows
    const cancellationsAndNoShows = appts
      .filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW')
      .slice(0, 15);

    return { statusBreakdown, cancellationsAndNoShows, total: appts.length };
  };

  if (!startDate || !endDate || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Invalid report parameters. Please generate a report from the Analytics page.</p>
      </div>
    );
  }

  const insights = getAppointmentInsights();

  return (
    <div className="min-h-screen bg-background">
      {/* Print Styles */}
      <style>{`
        @media print {
          .report-toolbar {
            display: none !important;
          }
          body, html {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 1.5cm;
            size: A4;
          }
          .report-section {
            break-inside: avoid;
          }
          .report-page {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-table {
            font-size: 10px !important;
            width: 100% !important;
          }
          .report-table th,
          .report-table td {
            padding: 4px 6px !important;
          }
          .stat-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .stat-card {
            padding: 8px !important;
          }
          .stat-card-value {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* Toolbar - hidden in print */}
      <div className="report-toolbar sticky top-0 z-10 bg-background border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.close()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Close
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">
              {business?.businessName} &middot; {formatDate(startDate)} &ndash; {formatDate(endDate)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-page max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {/* Report Header */}
            <div className="text-center mb-10 report-section">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">{business?.businessName || 'Business'}</h1>
              </div>
              <h2 className="text-lg text-muted-foreground mb-1">Analytics Report</h2>
              <p className="text-sm text-muted-foreground">
                {formatDate(startDate)} &ndash; {formatDate(endDate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Executive Summary */}
            {sections.includes('summary') && data.overview && (
              <ReportSection title="Executive Summary">
                <div className="stat-grid grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Appointments" value={data.overview.overview.totalAppointments} />
                  <StatCard label="Completed" value={data.overview.overview.completedAppointments} />
                  <StatCard label="Cancelled" value={data.overview.overview.cancelledAppointments} />
                  <StatCard label="No-Shows" value={data.overview.overview.noShows} />
                  <StatCard label="Pending" value={data.overview.overview.pendingAppointments} />
                  <StatCard label="Completion Rate" value={`${data.overview.overview.completionRate}%`} />
                  <StatCard label="Cancellation Rate" value={`${data.overview.overview.cancellationRate}%`} />
                  <StatCard label="No-Show Rate" value={`${data.overview.overview.noShowRate}%`} />
                </div>
              </ReportSection>
            )}

            {/* Booking Trends */}
            {sections.includes('trends') && data.trends && (
              <ReportSection title="Booking Trends">
                {data.trends.trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No booking data for this period.</p>
                ) : (
                  <table className="report-table w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left font-medium">Date</th>
                        <th className="py-2 px-3 text-right font-medium">Total</th>
                        <th className="py-2 px-3 text-right font-medium">Completed</th>
                        <th className="py-2 px-3 text-right font-medium">Confirmed</th>
                        <th className="py-2 px-3 text-right font-medium">Cancelled</th>
                        <th className="py-2 px-3 text-right font-medium">Pending</th>
                        <th className="py-2 px-3 text-right font-medium">No-Show</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trends.trends.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">{formatShortDate(row.date)}</td>
                          <td className="py-2 px-3 text-right">{row.total}</td>
                          <td className="py-2 px-3 text-right">{row.completed}</td>
                          <td className="py-2 px-3 text-right">{row.confirmed}</td>
                          <td className="py-2 px-3 text-right">{row.cancelled}</td>
                          <td className="py-2 px-3 text-right">{row.pending}</td>
                          <td className="py-2 px-3 text-right">{row.noShow}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ReportSection>
            )}

            {/* Service Performance */}
            {sections.includes('services') && data.services && (
              <ReportSection title="Service Performance">
                {data.services.serviceStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No service data for this period.</p>
                ) : (
                  <table className="report-table w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left font-medium">Service</th>
                        <th className="py-2 px-3 text-right font-medium">Bookings</th>
                        <th className="py-2 px-3 text-right font-medium">Completed</th>
                        <th className="py-2 px-3 text-right font-medium">Cancelled</th>
                        <th className="py-2 px-3 text-right font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.services.serviceStats.map((service, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">{service.serviceName}</td>
                          <td className="py-2 px-3 text-right">{service.totalBookings}</td>
                          <td className="py-2 px-3 text-right">{service.completedBookings}</td>
                          <td className="py-2 px-3 text-right">{service.cancelledBookings}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(service.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-medium">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">
                          {data.services.serviceStats.reduce((sum, s) => sum + s.totalBookings, 0)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {data.services.serviceStats.reduce((sum, s) => sum + s.completedBookings, 0)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {data.services.serviceStats.reduce((sum, s) => sum + s.cancelledBookings, 0)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(data.services.totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </ReportSection>
            )}

            {/* Employee Performance */}
            {sections.includes('employees') && data.employees && (
              <ReportSection title="Employee Performance">
                {data.employees.employeeStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No employee data for this period.</p>
                ) : (
                  <table className="report-table w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left font-medium">Employee</th>
                        <th className="py-2 px-3 text-right font-medium">Bookings</th>
                        <th className="py-2 px-3 text-right font-medium">Completed</th>
                        <th className="py-2 px-3 text-right font-medium">Cancelled</th>
                        <th className="py-2 px-3 text-right font-medium">No-Shows</th>
                        <th className="py-2 px-3 text-right font-medium">Rate</th>
                        <th className="py-2 px-3 text-right font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.employees.employeeStats.map((emp, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">{emp.employeeName}</td>
                          <td className="py-2 px-3 text-right">{emp.totalBookings}</td>
                          <td className="py-2 px-3 text-right">{emp.completedBookings}</td>
                          <td className="py-2 px-3 text-right">{emp.cancelledBookings}</td>
                          <td className="py-2 px-3 text-right">{emp.noShowBookings}</td>
                          <td className="py-2 px-3 text-right">{emp.completionRate}%</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(emp.revenue)}</td>
                        </tr>
                      ))}
                      {data.employees.unassigned.totalBookings > 0 && (
                        <tr className="border-b last:border-0 text-muted-foreground italic">
                          <td className="py-2 px-3">Unassigned</td>
                          <td className="py-2 px-3 text-right">{data.employees.unassigned.totalBookings}</td>
                          <td className="py-2 px-3 text-right">{data.employees.unassigned.completedBookings}</td>
                          <td className="py-2 px-3 text-right">-</td>
                          <td className="py-2 px-3 text-right">-</td>
                          <td className="py-2 px-3 text-right">-</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(data.employees.unassigned.revenue)}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-medium">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">
                          {data.employees.employeeStats.reduce((sum, e) => sum + e.totalBookings, 0) + data.employees.unassigned.totalBookings}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {data.employees.employeeStats.reduce((sum, e) => sum + e.completedBookings, 0) + data.employees.unassigned.completedBookings}
                        </td>
                        <td className="py-2 px-3 text-right" colSpan="3"></td>
                        <td className="py-2 px-3 text-right">{formatCurrency(data.employees.totalRevenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </ReportSection>
            )}

            {/* Popular Days & Time Slots */}
            {sections.includes('popular') && (
              <ReportSection title="Popular Days & Time Slots">
                <div className="grid grid-cols-2 gap-6">
                  {/* Days of Week */}
                  {data.days && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Bookings by Day of Week</h4>
                      {data.days.mostPopularDay && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Most popular: <span className="font-medium text-foreground">{data.days.mostPopularDay}</span>
                        </p>
                      )}
                      <table className="report-table w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-3 text-left font-medium">Day</th>
                            <th className="py-2 px-3 text-right font-medium">Total</th>
                            <th className="py-2 px-3 text-right font-medium">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.days.dayStats.map((day, i) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 px-3">{day.day}</td>
                              <td className="py-2 px-3 text-right">{day.total}</td>
                              <td className="py-2 px-3 text-right">{day.completed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Time Slots */}
                  {data.times && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Bookings by Time Slot</h4>
                      {data.times.peakHour && data.times.peakHour !== 'N/A' && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Peak hour: <span className="font-medium text-foreground">{data.times.peakHour}</span>
                        </p>
                      )}
                      <table className="report-table w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-3 text-left font-medium">Time</th>
                            <th className="py-2 px-3 text-right font-medium">Total</th>
                            <th className="py-2 px-3 text-right font-medium">Completed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.times.hourStats
                            .filter(h => h.total > 0)
                            .sort((a, b) => a.hour - b.hour)
                            .map((slot, i) => (
                              <tr key={i} className="border-b last:border-0">
                                <td className="py-2 px-3">{slot.hourLabel}</td>
                                <td className="py-2 px-3 text-right">{slot.total}</td>
                                <td className="py-2 px-3 text-right">{slot.completed}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </ReportSection>
            )}

            {/* Client Analytics */}
            {sections.includes('clients') && data.clients && (
              <ReportSection title="Client Analytics">
                <div className="stat-grid grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Unique Clients" value={data.clients.totalUniqueClients} />
                  <StatCard label="New Clients" value={data.clients.newClients} />
                  <StatCard label="Returning Clients" value={data.clients.returningClients} />
                  <StatCard label="Retention Rate" value={`${data.clients.retentionRate}%`} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Average {data.clients.avgBookingsPerClient} bookings per client
                </p>
                {data.clients.topClients.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium mt-4 mb-2">Top Clients</h4>
                    <table className="report-table w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-3 text-left font-medium">#</th>
                          <th className="py-2 px-3 text-left font-medium">Client</th>
                          <th className="py-2 px-3 text-left font-medium">Email</th>
                          <th className="py-2 px-3 text-right font-medium">Visits</th>
                          <th className="py-2 px-3 text-right font-medium">Total Spent</th>
                          <th className="py-2 px-3 text-right font-medium">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.clients.topClients.map((client, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                            <td className="py-2 px-3">{client.name}</td>
                            <td className="py-2 px-3 text-muted-foreground">{client.email}</td>
                            <td className="py-2 px-3 text-right font-medium">{client.visits}</td>
                            <td className="py-2 px-3 text-right">{formatCurrency(client.totalSpent)}</td>
                            <td className="py-2 px-3 text-right">{formatShortDate(client.lastVisitDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </ReportSection>
            )}

            {/* Revenue Over Time */}
            {sections.includes('revenue') && data.revenue && (
              <ReportSection title="Revenue Over Time">
                <div className="stat-grid grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Total Revenue" value={formatCurrency(data.revenue.summary.totalRevenue)} />
                  <StatCard label="Avg. per Appointment" value={formatCurrency(data.revenue.summary.avgRevenuePerAppointment)} />
                  <StatCard label="Avg. per Day" value={formatCurrency(data.revenue.summary.avgRevenuePerDay)} />
                  <StatCard
                    label="vs Previous Period"
                    value={
                      data.revenue.comparison.revenueChangePercent !== null
                        ? `${data.revenue.comparison.revenueChangePercent > 0 ? '+' : ''}${data.revenue.comparison.revenueChangePercent}%`
                        : 'N/A'
                    }
                  />
                </div>
                {data.revenue.revenueTrend.length > 0 && (
                  <table className="report-table w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left font-medium">Date</th>
                        <th className="py-2 px-3 text-right font-medium">Revenue</th>
                        <th className="py-2 px-3 text-right font-medium">Appointments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenue.revenueTrend.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">{formatShortDate(row.date)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(row.revenue)}</td>
                          <td className="py-2 px-3 text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-medium">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(data.revenue.summary.totalRevenue)}</td>
                        <td className="py-2 px-3 text-right">{data.revenue.summary.totalCompletedAppointments}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </ReportSection>
            )}

            {/* Appointment Insights (replaces raw appointment list) */}
            {sections.includes('appointments') && insights && (
              <>
                {/* Status Breakdown */}
                <ReportSection title="Appointment Status Breakdown">
                  <p className="text-xs text-muted-foreground mb-3">
                    {insights.total} total appointment{insights.total !== 1 ? 's' : ''} in this period
                  </p>
                  <table className="report-table w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 text-left font-medium">Status</th>
                        <th className="py-2 px-3 text-right font-medium">Count</th>
                        <th className="py-2 px-3 text-right font-medium">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.statusBreakdown.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">{row.count}</td>
                          <td className="py-2 px-3 text-right">{row.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ReportSection>

                {/* Recent Cancellations & No-Shows */}
                {insights.cancellationsAndNoShows.length > 0 && (
                  <ReportSection title="Recent Cancellations & No-Shows">
                    <p className="text-xs text-muted-foreground mb-3">
                      Last {insights.cancellationsAndNoShows.length} cancellation{insights.cancellationsAndNoShows.length !== 1 ? 's' : ''} and no-show{insights.cancellationsAndNoShows.length !== 1 ? 's' : ''}
                    </p>
                    <table className="report-table w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 px-3 text-left font-medium">Date</th>
                          <th className="py-2 px-3 text-left font-medium">Time</th>
                          <th className="py-2 px-3 text-left font-medium">Client</th>
                          <th className="py-2 px-3 text-left font-medium">Service</th>
                          <th className="py-2 px-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insights.cancellationsAndNoShows.map((appt, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-3 whitespace-nowrap">{formatShortDate(appt.appointmentDate)}</td>
                            <td className="py-2 px-3 whitespace-nowrap">{formatTime(appt.startTime)}</td>
                            <td className="py-2 px-3">{appt.clientFirstName} {appt.clientLastName}</td>
                            <td className="py-2 px-3">{appt.serviceName}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusClasses(appt.status)}`}>
                                {appt.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ReportSection>
                )}
              </>
            )}

            {/* No appointment data fallback */}
            {sections.includes('appointments') && !insights && (
              <ReportSection title="Appointment Insights">
                <p className="text-sm text-muted-foreground">No appointment data available for this period.</p>
              </ReportSection>
            )}

            {/* Footer */}
            <div className="mt-10 pt-4 border-t text-center text-xs text-muted-foreground">
              <p>End of Report &middot; {business?.businessName} &middot; Generated {new Date().toLocaleDateString()}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, children }) {
  return (
    <div className="report-section mb-8">
      <h3 className="text-lg font-semibold mb-4 pb-2 border-b">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="stat-card-value text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function getStatusClasses(status) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'NO_SHOW':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
