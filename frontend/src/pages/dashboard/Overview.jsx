import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useBusiness } from '../../context/BusinessContext';
import { getAppointments } from '../../services/appointmentsService';

const Overview = () => {
  const navigate = useNavigate();
  const { business, loading: businessLoading } = useBusiness();
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    cancellationRate: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      fetchDashboardData();
    }
  }, [business]);

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

      // Get pending appointments
      const pendingResponse = await getAppointments(business.id, {
        status: 'PENDING',
      });

      // Get last 30 days for cancellation rate
      const last30DaysResponse = await getAppointments(business.id, {
        startDate: thirtyDaysAgo,
      });

      // Get recent appointments (limit 5)
      const recentResponse = await getAppointments(business.id, {
        limit: 5,
        page: 1,
      });

      const todayCount = todayResponse.appointments?.length || 0;
      const pendingCount = pendingResponse.appointments?.length || 0;
      const last30Days = last30DaysResponse.appointments || [];
      const recent = recentResponse.appointments || [];

      // Calculate cancellation rate
      const totalLast30 = last30Days.length;
      const cancelledLast30 = last30Days.filter(apt => apt.status === 'CANCELLED').length;
      const cancellationRate = totalLast30 > 0 ? ((cancelledLast30 / totalLast30) * 100).toFixed(1) : 0;

      setStats({
        total: totalLast30,
        today: todayCount,
        pending: pendingCount,
        cancellationRate,
      });

      setRecentAppointments(recent);
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
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>
              Your most recent bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments to display
              </p>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
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
                        {appointment.appointmentDate} at {appointment.startTime}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Your booking statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Appointments</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Today's Bookings</span>
                <span className="font-medium">{stats.today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cancellation Rate</span>
                <span className="font-medium">{stats.cancellationRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
