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
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { getServices } from '../../services/servicesService';
import { createAppointment } from '../../services/appointmentsService';
import { getAvailability } from '../../services/availabilityService';
import { useBusiness } from '../../context/BusinessContext';
import { useToast } from '../../hooks/use-toast';

const CreateAppointmentDialog = ({ open, onOpenChange, businessId, onSuccess }) => {
  const { business } = useBusiness();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    serviceId: '',
    appointmentDate: '',
    startHour: '',
    startMinute: '',
    clientFirstName: '',
    clientLastName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
    clientNotes: '',
  });

  // UI state
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [workingHours, setWorkingHours] = useState(null);
  const [isNonWorkingDay, setIsNonWorkingDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [overrideWorkingHours, setOverrideWorkingHours] = useState(false);

  // Fetch services and availability when dialog opens
  useEffect(() => {
    if (open && businessId) {
      fetchServices();
      fetchAvailability();
    }
  }, [open, businessId]);

  // Check working hours when date changes
  useEffect(() => {
    if (formData.appointmentDate && availability.length > 0) {
      checkWorkingHours();
    } else {
      setWorkingHours(null);
      setIsNonWorkingDay(false);
    }
  }, [formData.appointmentDate, availability]);

  const fetchServices = async () => {
    try {
      const response = await getServices(businessId);
      const servicesList = response.services || response || [];
      const activeServices = servicesList.filter(s => s.isActive);
      setServices(activeServices);

      if (activeServices.length === 0) {
        toast({
          title: "No Services",
          description: "Please create services first in the Services page.",
          variant: "warning",
        });
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    }
  };

  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const response = await getAvailability(businessId);
      const availabilityData = response.data || response.availability || response || [];
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Error fetching availability:', err);
      toast({
        title: "Error",
        description: "Failed to load working hours",
        variant: "destructive",
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const checkWorkingHours = () => {
    if (!formData.appointmentDate || availability.length === 0) {
      setWorkingHours(null);
      setIsNonWorkingDay(false);
      return;
    }

    // Get day of week from selected date (0 = Sunday, 6 = Saturday)
    const selectedDate = new Date(formData.appointmentDate + 'T00:00:00');
    const dayOfWeek = selectedDate.getDay();

    // Find availability for this day
    const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);

    if (!dayAvailability || !dayAvailability.isAvailable) {
      setWorkingHours(null);
      setIsNonWorkingDay(true);
      // Reset time when switching to non-working day
      setFormData(prev => ({ ...prev, startHour: '', startMinute: '' }));
      return;
    }

    setIsNonWorkingDay(false);
    setWorkingHours({
      startHour: parseInt(dayAvailability.startTime.split(':')[0], 10),
      endHour: parseInt(dayAvailability.endTime.split(':')[0], 10),
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime,
    });
  };

  // Generate available hours based on working hours or full 24h if override
  const getAvailableHours = () => {
    if (overrideWorkingHours) {
      // All 24 hours available
      return Array.from({ length: 24 }, (_, i) => i);
    }

    if (!workingHours) {
      return [];
    }

    // Hours within working hours
    const hours = [];
    for (let h = workingHours.startHour; h < workingHours.endHour; h++) {
      hours.push(h);
    }
    return hours;
  };

  // Generate available minutes based on interval setting
  const getAvailableMinutes = () => {
    const interval = business?.defaultSlotInterval || 30;
    const minutes = [];
    for (let m = 0; m < 60; m += interval) {
      minutes.push(m);
    }
    return minutes;
  };

  // Format hour for display
  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  // Format minute for display
  const formatMinute = (minute) => {
    return String(minute).padStart(2, '0');
  };

  // Format time for display
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleHourChange = (e) => {
    setFormData(prev => ({ ...prev, startHour: e.target.value }));
    if (fieldErrors.startTime) {
      setFieldErrors(prev => ({ ...prev, startTime: null }));
    }
  };

  const handleMinuteChange = (e) => {
    setFormData(prev => ({ ...prev, startMinute: e.target.value }));
    if (fieldErrors.startTime) {
      setFieldErrors(prev => ({ ...prev, startTime: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.serviceId) errors.serviceId = 'Service is required';
    if (!formData.appointmentDate) errors.appointmentDate = 'Date is required';
    if (formData.startHour === '' || formData.startMinute === '') {
      errors.startTime = 'Time is required';
    }
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
      const selectedService = services.find(s => s.id === formData.serviceId);

      // Build start time from hour and minute
      const startTime = `${String(formData.startHour).padStart(2, '0')}:${String(formData.startMinute).padStart(2, '0')}`;

      // Calculate end time based on service duration
      const startDateTime = new Date(`${formData.appointmentDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + (selectedService.duration * 60000));
      const endTime = endDateTime.toTimeString().slice(0, 5);

      await createAppointment({
        businessId,
        serviceId: formData.serviceId,
        appointmentDate: formData.appointmentDate,
        startTime,
        endTime,
        clientFirstName: formData.clientFirstName,
        clientLastName: formData.clientLastName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone,
        notes: formData.notes,
        clientNotes: formData.clientNotes,
      });

      // Reset form
      setFormData({
        serviceId: '',
        appointmentDate: '',
        startHour: '',
        startMinute: '',
        clientFirstName: '',
        clientLastName: '',
        clientEmail: '',
        clientPhone: '',
        notes: '',
        clientNotes: '',
      });
      setOverrideWorkingHours(false);

      toast({
        title: "Success!",
        description: "Appointment created successfully",
        variant: "success",
      });

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Error creating appointment:', err);
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || 'Failed to create appointment',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      serviceId: '',
      appointmentDate: '',
      startHour: '',
      startMinute: '',
      clientFirstName: '',
      clientLastName: '',
      clientEmail: '',
      clientPhone: '',
      notes: '',
      clientNotes: '',
    });
    setFieldErrors({});
    setError(null);
    setOverrideWorkingHours(false);
    setIsNonWorkingDay(false);
    setWorkingHours(null);
    onOpenChange(false);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const availableHours = getAvailableHours();
  const availableMinutes = getAvailableMinutes();
  const isTimeDisabled = isNonWorkingDay && !overrideWorkingHours;

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

          {/* Override Working Hours Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="overrideWorkingHours"
              checked={overrideWorkingHours}
              onChange={(e) => {
                setOverrideWorkingHours(e.target.checked);
                // Reset time when toggling override
                setFormData(prev => ({ ...prev, startHour: '', startMinute: '' }));
              }}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="overrideWorkingHours" className="text-sm font-normal cursor-pointer">
              Override working hours (for emergencies or special cases)
            </Label>
          </div>

          {/* Time Selection - Clock Style */}
          <div className="space-y-2">
            <Label>
              Time <span className="text-destructive">*</span>
            </Label>

            {loadingAvailability ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading working hours...
              </div>
            ) : isTimeDisabled ? (
              /* Non-working day message */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <select
                    disabled
                    className="flex h-10 w-24 rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                  >
                    <option>Hour</option>
                  </select>
                  <span className="flex items-center text-muted-foreground">:</span>
                  <select
                    disabled
                    className="flex h-10 w-24 rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                  >
                    <option>Min</option>
                  </select>
                </div>
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  This is a non-working day. Check "Override working hours" to schedule anyway.
                </p>
              </div>
            ) : !formData.appointmentDate ? (
              <p className="text-sm text-muted-foreground">Select a date first</p>
            ) : (
              /* Clock-style time picker */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Hour Select */}
                  <select
                    value={formData.startHour}
                    onChange={handleHourChange}
                    className="flex h-10 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Hour</option>
                    {availableHours.map(hour => (
                      <option key={hour} value={hour}>
                        {formatHour(hour)}
                      </option>
                    ))}
                  </select>

                  <span className="text-lg font-semibold text-muted-foreground">:</span>

                  {/* Minute Select */}
                  <select
                    value={formData.startMinute}
                    onChange={handleMinuteChange}
                    className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Min</option>
                    {availableMinutes.map(minute => (
                      <option key={minute} value={minute}>
                        {formatMinute(minute)}
                      </option>
                    ))}
                  </select>

                  <Clock className="h-5 w-5 text-muted-foreground ml-2" />
                </div>

                {/* Working hours info */}
                {workingHours && !overrideWorkingHours && (
                  <p className="text-xs text-muted-foreground">
                    Working hours: {formatTimeDisplay(workingHours.startTime)} - {formatTimeDisplay(workingHours.endTime)}
                    {business?.defaultSlotInterval && ` | ${business.defaultSlotInterval} min intervals`}
                  </p>
                )}
                {overrideWorkingHours && (
                  <p className="text-xs text-muted-foreground">
                    All hours available (override enabled)
                    {business?.defaultSlotInterval && ` | ${business.defaultSlotInterval} min intervals`}
                  </p>
                )}
              </div>
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
            <Button type="submit" disabled={loading}>
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
