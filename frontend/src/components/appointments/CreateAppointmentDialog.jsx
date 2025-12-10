import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

const CreateAppointmentDialog = ({ open, onOpenChange, businessId, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    serviceId: '',
    appointmentDate: '',
    startTime: '',
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
    clientNotes: '',
  });

  // UI state
  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch services when dialog opens
  useEffect(() => {
    if (open && businessId) {
      fetchServices();
    }
  }, [open, businessId]);

  // Fetch available slots when service and date are selected
  useEffect(() => {
    if (formData.serviceId && formData.appointmentDate) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, startTime: '' }));
    }
  }, [formData.serviceId, formData.appointmentDate]);

  const fetchServices = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockServices = [
        { id: '1', name: 'Haircut', duration: 60 },
        { id: '2', name: 'Massage Therapy', duration: 90 },
        { id: '3', name: 'Consultation', duration: 30 },
      ];
      setServices(mockServices);
    } catch (err) {
      setError('Failed to load services');
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockSlots = [
        { startTime: '09:00', available: true },
        { startTime: '10:00', available: true },
        { startTime: '11:00', available: false },
        { startTime: '14:00', available: true },
        { startTime: '15:00', available: true },
        { startTime: '16:00', available: true },
      ];
      setAvailableSlots(mockSlots.filter(slot => slot.available));
    } catch (err) {
      setError('Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.serviceId) errors.serviceId = 'Service is required';
    if (!formData.appointmentDate) errors.appointmentDate = 'Date is required';
    if (!formData.startTime) errors.startTime = 'Time slot is required';
    if (!formData.clientFirstName) errors.clientFirstName = 'First name is required';
    if (!formData.clientLastName) errors.clientLastName = 'Last name is required';
    if (!formData.clientEmail) {
      errors.clientEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.clientEmail = 'Invalid email format';
    }
    if (!formData.clientPhone) {
      errors.clientPhone = 'Phone is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Creating appointment:', {
        businessId,
        ...formData
      });

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset form
      setFormData({
        serviceId: '',
        appointmentDate: '',
        startTime: '',
        clientFirstName: '',
        clientLastName: '',
        clientEmail: '',
        clientPhone: '',
        notes: '',
        clientNotes: '',
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form and errors
    setFormData({
      serviceId: '',
      appointmentDate: '',
      startTime: '',
      clientFirstName: '',
      clientLastName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
      clientNotes: '',
    });
    setFieldErrors({});
    setError(null);
    onOpenChange(false);
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Manually add an appointment for a client who booked offline or by phone
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId">
              Service <span className="text-destructive">*</span>
            </Label>
            <select
              id="serviceId"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a service</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} min)
                </option>
              ))}
            </select>
            {fieldErrors.serviceId && (
              <p className="text-sm text-destructive">{fieldErrors.serviceId}</p>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="appointmentDate">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appointmentDate"
              name="appointmentDate"
              type="date"
              min={today}
              value={formData.appointmentDate}
              onChange={handleChange}
            />
            {fieldErrors.appointmentDate && (
              <p className="text-sm text-destructive">{fieldErrors.appointmentDate}</p>
            )}
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label htmlFor="startTime">
              Time Slot <span className="text-destructive">*</span>
            </Label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available slots...
              </div>
            ) : availableSlots.length > 0 ? (
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a time slot</option>
                {availableSlots.map(slot => (
                  <option key={slot.startTime} value={slot.startTime}>
                    {formatTime(slot.startTime)}
                  </option>
                ))}
              </select>
            ) : formData.serviceId && formData.appointmentDate ? (
              <p className="text-sm text-muted-foreground">No available slots for this date</p>
            ) : (
              <p className="text-sm text-muted-foreground">Select a service and date first</p>
            )}
            {fieldErrors.startTime && (
              <p className="text-sm text-destructive">{fieldErrors.startTime}</p>
            )}
          </div>

          {/* Client Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Client Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientFirstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientFirstName"
                  name="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={handleChange}
                  placeholder="John"
                />
                {fieldErrors.clientFirstName && (
                  <p className="text-sm text-destructive">{fieldErrors.clientFirstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientLastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientLastName"
                  name="clientLastName"
                  value={formData.clientLastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
                {fieldErrors.clientLastName && (
                  <p className="text-sm text-destructive">{fieldErrors.clientLastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                />
                {fieldErrors.clientEmail && (
                  <p className="text-sm text-destructive">{fieldErrors.clientEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="clientPhone"
                  name="clientPhone"
                  type="tel"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  placeholder="+1 555-0100"
                />
                {fieldErrors.clientPhone && (
                  <p className="text-sm text-destructive">{fieldErrors.clientPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Business Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Internal notes about this appointment..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientNotes">Client Notes (Optional)</Label>
              <Textarea
                id="clientNotes"
                name="clientNotes"
                value={formData.clientNotes}
                onChange={handleChange}
                placeholder="Notes from the client..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingSlots}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Appointment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAppointmentDialog;
