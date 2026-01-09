import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, TrendingUp, AlertCircle, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useBusiness } from '../../context/BusinessContext';
import { getAppointments } from '../../services/appointmentsService';
import { useRefreshListener, REFRESH_EVENTS } from '../../components/notifications/NotificationListener';

const Overview = () => {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useBusiness();
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    cancellationRate: 0,
    upcomingCount: 0,
    thisWeek: 0,
    completed: 0,
    nextAppointment: null,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (business?.id) {
      fetchDashboardData();
    }
  }, [business]);

  // Listen for real-time refresh events (new appointments, status changes)
  useRefreshListener(REFRESH_EVENTS.OVERVIEW, useCallback(() => {
    console.log('🔄 Refreshing overview data...');
    fetchDashboardData();
  }, [business?.id]));

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all appointments
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get appointments for today
      const todayResponse = await getAppointments(business.id, {
        startDate: today,
        endDate: today,
        status: 'CONFIRMED',
      });

      // Get pending appointments (from last 30 days onwards for consistency with analytics)
      const pendingResponse = await getAppointments(business.id, {
        status: 'PENDING',
        startDate: thirtyDaysAgo,
      });

      // Get last 30 days for cancellation rate
      const last30DaysResponse = await getAppointments(business.id, {
        startDate: thirtyDaysAgo,
      });

      // Get today's and upcoming appointments for the recent appointments card
      const upcomingResponse = await getAppointments(business.id, {
        startDate: today,
      });

      const todayCount = (todayResponse.data || todayResponse.appointments)?.length || 0;
      const pendingCount = (pendingResponse.data || pendingResponse.appointments)?.length || 0;
      const last30Days = last30DaysResponse.data || last30DaysResponse.appointments || [];
      const upcoming = upcomingResponse.data || upcomingResponse.appointments || [];

      // Filter and sort upcoming appointments (today and future, excluding completed and cancelled)
      const sortedUpcoming = upcoming
        .filter(apt => {
          const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
          const todayDate = new Date(today + 'T00:00:00');
          return aptDate >= todayDate &&
                 apt.status !== 'CANCELLED' &&
                 apt.status !== 'COMPLETED';
        })
        .sort((a, b) => {
          // Sort by date first, then by time
          const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
          if (dateCompare !== 0) return dateCompare;

          const timeA = a.startTime || '00:00';
          const timeB = b.startTime || '00:00';
          return timeA.localeCompare(timeB);
        });

      // Calculate additional statistics
      const totalLast30 = last30Days.length;
      const cancelledLast30 = last30Days.filter(apt => apt.status === 'CANCELLED').length;
      const cancellationRate = totalLast30 > 0 ? ((cancelledLast30 / totalLast30) * 100).toFixed(1) : 0;

      // Count completed appointments in last 30 days
      const completedLast30 = last30Days.filter(apt => apt.status === 'COMPLETED').length;

      // Calculate this week's appointments
      const todayDate = new Date();
      const weekStart = new Date(todayDate);
      weekStart.setDate(todayDate.getDate() - todayDate.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7); // End of week

      const thisWeekAppointments = sortedUpcoming.filter(apt => {
        const aptDate = new Date(apt.appointmentDate + 'T00:00:00');
        return aptDate >= weekStart && aptDate < weekEnd;
      });

      // Get next appointment (first in sortedUpcoming)
      const nextApt = sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;

      setStats({
        total: totalLast30,
        today: todayCount,
        pending: pendingCount,
        cancellationRate,
        upcomingCount: sortedUpcoming.length,
        thisWeek: thisWeekAppointments.length,
        completed: completedLast30,
        nextAppointment: nextApt,
      });

      setRecentAppointments(sortedUpcoming);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      COMPLETED: 'info',
      CANCELLED: 'destructive',
      NO_SHOW: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const formatAppointmentDateTime = (date, time) => {
    const aptDate = new Date(date + 'T00:00:00');

    // Get day with ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const day = aptDate.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'];
    const relevantDigits = (day < 30) ? day % 20 : day % 30;
    const ordinal = (relevantDigits <= 3) ? suffix[relevantDigits] : suffix[0];

    // Get month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[aptDate.getMonth()];

    // Get year
    const year = aptDate.getFullYear();

    // Format time (remove seconds if present)
    const formattedTime = time ? time.substring(0, 5) : '';

    return `${day}${ordinal} of ${month} ${year} at ${formattedTime}`;
  };

  // Pagination logic
  const totalPages = Math.ceil(recentAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = recentAppointments.slice(startIndex, endIndex);

  if (businessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Welcome back{business?.businessName ? `, ${business.businessName}` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Today
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Confirmations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancellationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Confirmed and pending appointments scheduled for today and upcoming days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments to display
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {currentAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/dashboard/appointments/${appointment.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {appointment.clientFirstName} {appointment.clientLastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatAppointmentDateTime(appointment.appointmentDate, appointment.startTime)}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} • Showing {currentAppointments.length} of {recentAppointments.length} appointments
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Your business overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Next Appointment */}
              {stats.nextAppointment && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Next Appointment</span>
                  </div>
                  <p className="text-sm font-medium">
                    {stats.nextAppointment.clientFirstName} {stats.nextAppointment.clientLastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAppointmentDateTime(stats.nextAppointment.appointmentDate, stats.nextAppointment.startTime)}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">This Week</span>
                  </div>
                  <span className="font-semibold text-lg">{stats.thisWeek}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Upcoming</span>
                  </div>
                  <span className="font-semibold text-lg">{stats.upcomingCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Pending Confirmation</span>
                  </div>
                  <span className="font-semibold text-lg">{stats.pending}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Completed (30d)</span>
                  </div>
                  <span className="font-semibold text-lg">{stats.completed}</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cancellation Rate</span>
                    <span className={`font-semibold text-lg ${parseFloat(stats.cancellationRate) > 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {stats.cancellationRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
