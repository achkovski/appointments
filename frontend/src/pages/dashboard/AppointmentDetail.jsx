import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Ban,
  CalendarClock,
  Save,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  getAppointment,
  updateAppointment,
  updateAppointmentStatus,
  confirmAppointment as confirmAppointmentService,
  cancelAppointment as cancelAppointmentService,
} from '../../services/appointmentsService';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch appointment data from API
  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointment(id);
      const aptData = response.data || response.appointment || response;
      setAppointment(aptData);
      setNotes(aptData.notes || '');
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError(err.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase();
    const variants = {
      CONFIRMED: { variant: 'success', label: 'Confirmed', icon: CheckCircle, color: 'text-green-600' },
      PENDING: { variant: 'warning', label: 'Pending', icon: AlertCircle, color: 'text-yellow-600' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
      COMPLETED: { variant: 'secondary', label: 'Completed', icon: CheckCircle, color: 'text-gray-600' },
      NO_SHOW: { variant: 'outline', label: 'No Show', icon: XCircle, color: 'text-gray-500' },
    };

    const config = variants[statusUpper] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle YYYY-MM-DD format
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (err) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) return 'Invalid Time';
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (err) {
      return 'Invalid Time';
    }
  };

  const handleSaveNotes = async () => {
    try {
      setActionLoading(true);
      await updateAppointment(id, { notes });
      setAppointment({ ...appointment, notes });
      setIsEditingNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      alert(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      await confirmAppointmentService(id);
      setAppointment({ ...appointment, status: 'CONFIRMED' });
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error confirming appointment:', err);
      alert(err.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await cancelAppointmentService(id, cancellationReason);
      setAppointment({ ...appointment, status: 'CANCELLED', cancellationReason });
      setShowCancelDialog(false);
      setCancellationReason('');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    try {
      setActionLoading(true);
      // Calculate end time based on service duration
      const startDate = new Date(`2000-01-01T${rescheduleTime}`);
      const duration = appointment.service?.duration || appointment.serviceDuration || 60;
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const endTime = endDate.toTimeString().slice(0, 5);

      await updateAppointment(id, {
        appointmentDate: rescheduleDate,
        startTime: rescheduleTime,
        endTime: endTime,
      });

      setAppointment({
        ...appointment,
        appointmentDate: rescheduleDate,
        startTime: rescheduleTime,
        endTime: endTime,
      });
      setShowRescheduleDialog(false);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      alert(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      setActionLoading(true);
      await updateAppointmentStatus(id, 'COMPLETED');
      setAppointment({ ...appointment, status: 'COMPLETED' });
    } catch (err) {
      console.error('Error marking as completed:', err);
      alert(err.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactClient = (method) => {
    if (method === 'email') {
      window.location.href = `mailto:${appointment.clientEmail}`;
    } else if (method === 'phone') {
      window.location.href = `tel:${appointment.clientPhone}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {error ? 'Error Loading Appointment' : 'Appointment Not Found'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {error || "The appointment you're looking for doesn't exist or has been deleted."}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/appointments')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Button>
          {error && (
            <Button variant="outline" onClick={fetchAppointment}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/appointments')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Appointment Details</h2>
            <p className="text-muted-foreground">
              ID: {appointment.id}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">
                {appointment.clientFirstName} {appointment.clientLastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${appointment.clientEmail}`}
                  className="text-primary hover:underline"
                >
                  {appointment.clientEmail}
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${appointment.clientPhone}`}
                  className="text-primary hover:underline"
                >
                  {appointment.clientPhone}
                </a>
              </div>
            </div>
            {appointment.clientNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Notes</p>
                <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                  {appointment.clientNotes}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleContactClient('email')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleContactClient('phone')}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service</p>
              <p className="text-lg font-semibold">
                {appointment.service?.name || appointment.serviceName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duration</p>
              <p className="font-medium">
                {appointment.service?.duration || appointment.serviceDuration || 'N/A'} minutes
              </p>
            </div>
            {(appointment.service?.price || appointment.servicePrice) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="font-medium">${appointment.service?.price || appointment.servicePrice}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Confirmed</p>
              <Badge variant={appointment.isEmailConfirmed ? 'success' : 'warning'}>
                {appointment.isEmailConfirmed ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Business Notes
            </CardTitle>
            {!isEditingNotes && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Notes
              </Button>
            )}
          </div>
          <CardDescription>
            Internal notes for this appointment (not visible to client)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingNotes ? (
            <div className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this appointment..."
                rows={5}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveNotes} disabled={actionLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {actionLoading ? 'Saving...' : 'Save Notes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNotes(appointment.notes || '');
                    setIsEditingNotes(false);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {appointment.notes ? (
                <p className="text-sm p-3 bg-muted rounded-md">{appointment.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes added yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage this appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {appointment.status?.toUpperCase() === 'PENDING' && (
              <Button onClick={() => setShowConfirmDialog(true)} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Appointment
              </Button>
            )}
            {(appointment.status?.toUpperCase() === 'PENDING' || appointment.status?.toUpperCase() === 'CONFIRMED') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleDialog(true)}
                  disabled={actionLoading}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={actionLoading}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Appointment
                </Button>
              </>
            )}
            {appointment.status?.toUpperCase() === 'CONFIRMED' && (
              <Button
                variant="outline"
                onClick={handleMarkCompleted}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {actionLoading ? 'Updating...' : 'Mark as Completed'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this appointment? The client will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={actionLoading}>
              {actionLoading ? 'Confirming...' : 'Confirm Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Enter reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime || actionLoading}
            >
              {actionLoading ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentDetail;
