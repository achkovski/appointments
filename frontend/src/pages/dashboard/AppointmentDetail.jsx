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

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Mock data for testing - will be replaced with API call
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockAppointment = {
        id: id,
        clientFirstName: 'John',
        clientLastName: 'Doe',
        clientEmail: 'john.doe@example.com',
        clientPhone: '+1 555-0101',
        appointmentDate: '2025-12-15',
        startTime: '10:00',
        endTime: '11:00',
        status: 'confirmed',
        serviceName: 'Haircut',
        serviceDuration: 60,
        servicePrice: 50,
        notes: 'First time client, prefers short cut',
        clientNotes: 'Please be gentle, first time getting a professional haircut',
        createdAt: '2025-12-10T10:00:00Z',
        updatedAt: '2025-12-10T10:00:00Z',
        isEmailConfirmed: true,
        businessName: 'My Business',
      };
      setAppointment(mockAppointment);
      setNotes(mockAppointment.notes || '');
      setLoading(false);
    }, 500);
  }, [id]);

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: { variant: 'success', label: 'Confirmed', icon: CheckCircle, color: 'text-green-600' },
      pending: { variant: 'warning', label: 'Pending', icon: AlertCircle, color: 'text-yellow-600' },
      cancelled: { variant: 'destructive', label: 'Cancelled', icon: XCircle, color: 'text-red-600' },
      completed: { variant: 'secondary', label: 'Completed', icon: CheckCircle, color: 'text-gray-600' },
      no_show: { variant: 'outline', label: 'No Show', icon: XCircle, color: 'text-gray-500' },
    };

    const config = variants[status.toLowerCase()] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSaveNotes = () => {
    // TODO: API call to save notes
    console.log('Saving notes:', notes);
    setAppointment({ ...appointment, notes });
    setIsEditingNotes(false);
  };

  const handleConfirm = () => {
    // TODO: API call to confirm appointment
    console.log('Confirming appointment');
    setAppointment({ ...appointment, status: 'confirmed' });
    setShowConfirmDialog(false);
  };

  const handleCancel = () => {
    // TODO: API call to cancel appointment
    console.log('Cancelling appointment with reason:', cancellationReason);
    setAppointment({ ...appointment, status: 'cancelled', cancellationReason });
    setShowCancelDialog(false);
    setCancellationReason('');
  };

  const handleReschedule = () => {
    // TODO: API call to reschedule appointment
    console.log('Rescheduling to:', rescheduleDate, rescheduleTime);
    setAppointment({
      ...appointment,
      appointmentDate: rescheduleDate,
      startTime: rescheduleTime
    });
    setShowRescheduleDialog(false);
    setRescheduleDate('');
    setRescheduleTime('');
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

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Appointment Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The appointment you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/dashboard/appointments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Button>
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
              <p className="text-lg font-semibold">{appointment.serviceName}</p>
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
              <p className="font-medium">{appointment.serviceDuration} minutes</p>
            </div>
            {appointment.servicePrice && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Price</p>
                <p className="font-medium">${appointment.servicePrice}</p>
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
                <Button onClick={handleSaveNotes}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNotes(appointment.notes || '');
                    setIsEditingNotes(false);
                  }}
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
            {appointment.status.toLowerCase() === 'pending' && (
              <Button onClick={() => setShowConfirmDialog(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Appointment
              </Button>
            )}
            {(appointment.status.toLowerCase() === 'pending' || appointment.status.toLowerCase() === 'confirmed') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRescheduleDialog(true)}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Appointment
                </Button>
              </>
            )}
            {appointment.status.toLowerCase() === 'confirmed' && (
              <Button
                variant="outline"
                onClick={() => {
                  setAppointment({ ...appointment, status: 'completed' });
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
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
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Appointment
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
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Appointment
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
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime}
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentDetail;
