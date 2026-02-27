import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useBusiness } from '../../context/BusinessContext';
import { nowInTimezone } from '../../utils/timezone';
import {
  getAnalyticsOverview,
  getBookingTrends,
  getPopularDays,
  getPopularTimeSlots,
  getServicePerformance,
  getEmployeePerformance,
  getClientAnalytics,
  getRevenueOverTime,
  exportAnalytics,
  downloadCSV
} from '../../services/analyticsService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  CalendarDays,
  BarChart3,
  RefreshCw,
  FileText,
  DollarSign,
  UserPlus,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import ReportGeneratorModal from '../../components/reports/ReportGeneratorModal';

const Analytics = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [groupBy, setGroupBy] = useState('day');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Analytics data states
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [popularDays, setPopularDays] = useState([]);
  const [popularTimes, setPopularTimes] = useState([]);
  const [serviceStats, setServiceStats] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [mostPopularDay, setMostPopularDay] = useState('N/A');
  const [peakHour, setPeakHour] = useState('N/A');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [clientAnalytics, setClientAnalytics] = useState(null);
  const [revenueData, setRevenueData] = useState(null);

  // Calculate date range in business timezone
  const getDateParams = () => {
    const tz = business?.timezone || 'Europe/Skopje';
    const { date: todayStr } = nowInTimezone(tz);
    const [y, m, d] = todayStr.split('-').map(Number);
    const startDate = new Date(Date.UTC(y, m - 1, d - parseInt(dateRange)));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: todayStr
    };
  };

  // Fetch all analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!business?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = getDateParams();

      // Fetch all data in parallel
      const [overviewRes, trendsRes, daysRes, timesRes, servicesRes, employeesRes, clientsRes, revenueRes] = await Promise.all([
        getAnalyticsOverview(params),
        getBookingTrends({ ...params, groupBy }),
        getPopularDays(params),
        getPopularTimeSlots(params),
        getServicePerformance(params),
        getEmployeePerformance(params),
        getClientAnalytics(params),
        getRevenueOverTime({ ...params, groupBy })
      ]);

      // Set overview data
      if (overviewRes.success) {
        setOverview(overviewRes.data.overview);
      }

      // Set trends data
      if (trendsRes.success) {
        setTrends(trendsRes.data.trends);
      }

      // Set popular days data
      if (daysRes.success) {
        setPopularDays(daysRes.data.dayStats);
        setMostPopularDay(daysRes.data.mostPopularDay);
      }

      // Set popular times data
      if (timesRes.success) {
        setPopularTimes(timesRes.data.allHourStats || timesRes.data.hourStats);
        setPeakHour(timesRes.data.peakHour);
      }

      // Set service performance data
      if (servicesRes.success) {
        setServiceStats(servicesRes.data.serviceStats);
        setTotalRevenue(servicesRes.data.totalRevenue);
      }

      // Set employee performance data
      if (employeesRes.success) {
        setEmployeeStats(employeesRes.data.employeeStats);
      }

      // Set client analytics data
      if (clientsRes.success) {
        setClientAnalytics(clientsRes.data);
      }

      // Set revenue data
      if (revenueRes.success) {
        setRevenueData(revenueRes.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [business?.id, dateRange, groupBy]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export data as CSV
  const handleExport = async () => {
    try {
      const params = getDateParams();
      const blob = await exportAnalytics({ ...params, type: 'appointments' });
      downloadCSV(blob, `appointments-${params.startDate}-to-${params.endDate}.csv`);
    } catch (err) {
      console.error('Error exporting data:', err);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Prepare pie chart data for appointment status
  const statusPieData = overview ? [
    { name: 'Completed', value: overview.completedAppointments, color: '#10b981' },
    { name: 'Confirmed', value: overview.confirmedAppointments, color: '#3b82f6' },
    { name: 'Pending', value: overview.pendingAppointments, color: '#f59e0b' },
    { name: 'Cancelled', value: overview.cancelledAppointments, color: '#ef4444' },
    { name: 'No-show', value: overview.noShows, color: '#6b7280' }
  ].filter(item => item.value > 0) : [];

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Track your booking trends and business insights</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">Track your booking trends and business insights</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button size="sm" onClick={() => setReportModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        dateRange={dateRange}
        hasEmployees={employeeStats.length > 0}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.completedAppointments || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.cancellationRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.cancelledAppointments || 0} cancelled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.noShowRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {overview?.noShows || 0} no-shows
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From completed appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Day</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostPopularDay}</div>
            <p className="text-xs text-muted-foreground">Highest booking volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hours</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakHour}</div>
            <p className="text-xs text-muted-foreground">Most active time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.pendingAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Booking Trends Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Booking Trends
            </CardTitle>
            <CardDescription>Appointment volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Completed"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cancelled"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Cancelled"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No booking data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Appointment Status
            </CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No appointment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Popular Days Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Popular Days
            </CardTitle>
            <CardDescription>Bookings by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            {popularDays.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularDays}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.substring(0, 3)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Bookings" />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No booking data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Time Slots Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Popular Time Slots
            </CardTitle>
            <CardDescription>Bookings by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            {popularTimes.some(t => t.total > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularTimes.filter(t => t.hour >= 6 && t.hour <= 22)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fontSize: 11 }}
                    interval={1}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No time slot data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Service Performance
          </CardTitle>
          <CardDescription>Booking statistics by service</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-right py-3 px-4 font-medium">Total Bookings</th>
                    <th className="text-right py-3 px-4 font-medium">Completed</th>
                    <th className="text-right py-3 px-4 font-medium">Cancelled</th>
                    <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceStats.map((service, index) => (
                    <tr key={service.serviceId || index} className="border-b last:border-0">
                      <td className="py-3 px-4">{service.serviceName}</td>
                      <td className="text-right py-3 px-4">{service.totalBookings}</td>
                      <td className="text-right py-3 px-4 text-green-600">{service.completedBookings}</td>
                      <td className="text-right py-3 px-4 text-red-600">{service.cancelledBookings}</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(service.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="py-3 px-4 font-medium">Total</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {serviceStats.reduce((sum, s) => sum + s.totalBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-green-600">
                      {serviceStats.reduce((sum, s) => sum + s.completedBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-red-600">
                      {serviceStats.reduce((sum, s) => sum + s.cancelledBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-bold">{formatCurrency(totalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No service data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Performance Table */}
      {employeeStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Performance
            </CardTitle>
            <CardDescription>Booking statistics by employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Employee</th>
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                    <th className="text-right py-3 px-4 font-medium">Completed</th>
                    <th className="text-right py-3 px-4 font-medium">Cancelled</th>
                    <th className="text-right py-3 px-4 font-medium">No-Shows</th>
                    <th className="text-right py-3 px-4 font-medium">Completion %</th>
                    <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeStats.map((employee, index) => (
                    <tr key={employee.employeeId || index} className="border-b last:border-0">
                      <td className="py-3 px-4">{employee.employeeName}</td>
                      <td className="text-right py-3 px-4">{employee.totalBookings}</td>
                      <td className="text-right py-3 px-4 text-green-600">{employee.completedBookings}</td>
                      <td className="text-right py-3 px-4 text-red-600">{employee.cancelledBookings}</td>
                      <td className="text-right py-3 px-4 text-yellow-600">{employee.noShowBookings}</td>
                      <td className="text-right py-3 px-4">{employee.completionRate}%</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(employee.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <td className="py-3 px-4 font-medium">Total</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {employeeStats.reduce((sum, e) => sum + e.totalBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-green-600">
                      {employeeStats.reduce((sum, e) => sum + e.completedBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-red-600">
                      {employeeStats.reduce((sum, e) => sum + e.cancelledBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium text-yellow-600">
                      {employeeStats.reduce((sum, e) => sum + e.noShowBookings, 0)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">-</td>
                    <td className="text-right py-3 px-4 font-bold">
                      {formatCurrency(employeeStats.reduce((sum, e) => sum + e.revenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Analytics */}
      {clientAnalytics && (
        <>
          {/* Client Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientAnalytics.totalUniqueClients}</div>
                <p className="text-xs text-muted-foreground">
                  {clientAnalytics.newClients} new, {clientAnalytics.returningClients} returning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientAnalytics.retentionRate}%</div>
                <p className="text-xs text-muted-foreground">Clients with repeat bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Bookings/Client</CardTitle>
                <CalendarDays className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientAnalytics.avgBookingsPerClient}</div>
                <p className="text-xs text-muted-foreground">Average visits per client</p>
              </CardContent>
            </Card>
          </div>

          {/* Client Analytics Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* New vs Returning Donut */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  New vs Returning Clients
                </CardTitle>
                <CardDescription>Client acquisition breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {clientAnalytics.totalUniqueClients > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'New Clients', value: clientAnalytics.newClients, color: '#3b82f6' },
                          { name: 'Returning Clients', value: clientAnalytics.returningClients, color: '#10b981' }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {[
                          { name: 'New Clients', value: clientAnalytics.newClients, color: '#3b82f6' },
                          { name: 'Returning Clients', value: clientAnalytics.returningClients, color: '#10b981' }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No client data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Clients Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Clients
                </CardTitle>
                <CardDescription>Most frequent visitors</CardDescription>
              </CardHeader>
              <CardContent>
                {clientAnalytics.topClients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-sm">#</th>
                          <th className="text-left py-2 px-3 font-medium text-sm">Client</th>
                          <th className="text-right py-2 px-3 font-medium text-sm">Visits</th>
                          <th className="text-right py-2 px-3 font-medium text-sm">Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientAnalytics.topClients.map((client, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-3 text-sm text-muted-foreground">{i + 1}</td>
                            <td className="py-2 px-3 text-sm">
                              <div>{client.name}</div>
                              <div className="text-xs text-muted-foreground">{client.email}</div>
                            </td>
                            <td className="text-right py-2 px-3 text-sm font-medium">{client.visits}</td>
                            <td className="text-right py-2 px-3 text-sm">{formatCurrency(client.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No client data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Revenue Over Time */}
      {revenueData && (
        <>
          {/* Revenue Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueData.summary.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  {revenueData.summary.totalCompletedAppointments} completed appointments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. per Appointment</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueData.summary.avgRevenuePerAppointment)}</div>
                <p className="text-xs text-muted-foreground">Per completed appointment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. per Day</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueData.summary.avgRevenuePerDay)}</div>
                <p className="text-xs text-muted-foreground">Over {revenueData.summary.daysInRange} days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">vs Previous Period</CardTitle>
                {revenueData.comparison.revenueChangePercent !== null ? (
                  revenueData.comparison.revenueChangePercent >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  revenueData.comparison.revenueChangePercent === null
                    ? ''
                    : revenueData.comparison.revenueChangePercent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}>
                  {revenueData.comparison.revenueChangePercent !== null
                    ? `${revenueData.comparison.revenueChangePercent > 0 ? '+' : ''}${revenueData.comparison.revenueChangePercent}%`
                    : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {revenueData.comparison.revenueChangePercent !== null
                    ? `Previous: ${formatCurrency(revenueData.comparison.previousRevenue)}`
                    : 'No previous data'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Over Time
              </CardTitle>
              <CardDescription>Revenue from completed appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                        return [value, 'Appointments'];
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No revenue data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Analytics;
