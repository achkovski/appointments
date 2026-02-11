import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import StatusBadge from '../components/appointments/StatusBadge';
import { toastSuccess, toastError } from '../utils/toastHelpers';
import { getCityDisplayName } from '../utils/locationConstants';
import {
  getBusinessBySlug,
  getAvailableSlots,
  getEmployeesForService,
  createBooking,
} from '../services/publicBookingService';
import {
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  User,
  Users,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  Building,
} from 'lucide-react';

const STEPS = {
  SELECT_SERVICE: 1,
  SELECT_EMPLOYEE: 2,
  SELECT_DATE: 3,
  SELECT_TIME: 4,
  CLIENT_INFO: 5,
  CONFIRM: 6,
  SUCCESS: 7,
};

const BookingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Data state
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Selection state
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_SERVICE);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

  // Client form state
  const [clientInfo, setClientInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    website: '',
  });

  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  // Fetch business data on mount
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getBusinessBySlug(slug);

        if (response.success) {
          setBusiness(response.data);
          setServices(response.data.services || []);
        } else {
          setError('Business not found');
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError(err.response?.data?.message || 'Failed to load business information');
        toastError('Error', 'Could not load business information');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [slug]);

  // Fetch available slots when date is selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedService) return;

      try {
        setSlotsLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const employeeId = selectedEmployee?.id || null;
        const response = await getAvailableSlots(slug, selectedService.id, formattedDate, employeeId);

        if (response.success) {
          setAvailableSlots(response.data.slots || []);
          if (!response.data.available) {
            toastError('No slots available', response.data.reason || 'Please select a different date');
          }
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        toastError('Error', 'Failed to load available time slots');
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedService, selectedEmployee, slug]);

  const handleServiceSelect = async (service) => {
    setSelectedService(service);
    setSelectedEmployee(null);

    try {
      setEmployeesLoading(true);
      const response = await getEmployeesForService(service.id);

      if (response.success) {
        setEmployees(response.data.employees || []);

        // Skip employee selection if not enabled or no employees
        if (!response.data.employeeBookingEnabled || response.data.employees.length === 0) {
          setCurrentStep(STEPS.SELECT_DATE);
        } else {
          setCurrentStep(STEPS.SELECT_EMPLOYEE);
        }
      } else {
        setCurrentStep(STEPS.SELECT_DATE);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      // If error, skip employee selection
      setCurrentStep(STEPS.SELECT_DATE);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setCurrentStep(STEPS.SELECT_DATE);
  };

  const handleSkipEmployeeSelection = () => {
    setSelectedEmployee(null);
    setCurrentStep(STEPS.SELECT_DATE);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setCurrentStep(STEPS.SELECT_TIME);
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setCurrentStep(STEPS.CLIENT_INFO);
  };

  const handleClientInfoChange = (field, value) => {
    setClientInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateClientInfo = () => {
    const { firstName, lastName, email, phone } = clientInfo;

    if (!firstName.trim() || !lastName.trim()) {
      toastError('Missing information', 'Please enter your first and last name');
      return false;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toastError('Invalid email', 'Please enter a valid email address');
      return false;
    }

    if (!phone.trim()) {
      toastError('Missing phone number', 'Please enter your phone number');
      return false;
    }

    return true;
  };

  const handleClientInfoSubmit = () => {
    if (validateClientInfo()) {
      setCurrentStep(STEPS.CONFIRM);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);

      const bookingData = {
        businessSlug: slug,
        serviceId: selectedService.id,
        employeeId: selectedEmployee?.id || undefined,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTimeSlot.startTime,
        clientFirstName: clientInfo.firstName.trim(),
        clientLastName: clientInfo.lastName.trim(),
        clientEmail: clientInfo.email.trim(),
        clientPhone: clientInfo.phone.trim(),
        clientNotes: clientInfo.notes.trim() || undefined,
        website: clientInfo.website,
      };

      const response = await createBooking(bookingData);

      if (response.success) {
        setBookingResult(response.appointment || response.data || response);
        setCurrentStep(STEPS.SUCCESS);
        toastSuccess('Success!', 'Your appointment has been booked');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toastError('Booking failed', err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (currentStep > STEPS.SELECT_SERVICE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(STEPS.SELECT_SERVICE);
    setSelectedService(null);
    setSelectedEmployee(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setClientInfo({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
    setBookingResult(null);
    setEmployees([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Business Not Found</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Business Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{business?.businessName}</h1>
          {business?.description && (
            <p className="text-gray-600 mb-4">{business.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {business?.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {business.address}
                  {business.city && `, ${getCityDisplayName(business.city)}`}
                </span>
              </div>
            )}
            {business?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{business.phone}</span>
              </div>
            )}
            {business?.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{business.email}</span>
              </div>
            )}
            {business?.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {business.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 6 && (
                  <div
                    className={`h-1 w-8 md:w-16 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Service</span>
            <span>Staff</span>
            <span>Date</span>
            <span>Time</span>
            <span>Info</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 1: Service Selection */}
        {currentStep === STEPS.SELECT_SERVICE && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Select a Service</h2>
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-600">
                  No services available at this time
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((service) => (
                  <Card key={service.id} className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col h-full">
                    <CardHeader className="flex-none">
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription className="min-h-[3rem]">
                        {service.description || '\u00A0'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 pt-0">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5 h-5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm">{service.duration} minutes</span>
                        </div>
                        <div className="flex items-center gap-3 min-h-[1.5rem]">
                          {service.price ? (
                            <>
                              <div className="flex items-center justify-center w-5 h-5">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="text-sm">${service.price}</span>
                            </>
                          ) : (
                            <div className="w-5 h-5"></div>
                          )}
                        </div>
                      </div>
                      <Button
                        className="w-full mt-auto"
                        onClick={() => handleServiceSelect(service)}
                      >
                        Select Service
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Employee Selection */}
        {currentStep === STEPS.SELECT_EMPLOYEE && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Choose a Staff Member</h2>
                <p className="text-gray-600 mt-1">
                  Service: <span className="font-medium">{selectedService?.name}</span>
                </p>
              </div>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            {employeesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Any Available Option */}
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed"
                  onClick={handleSkipEmployeeSelection}
                >
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Any Available</h3>
                        <p className="text-sm text-gray-600">
                          Book with the first available staff member
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Options */}
                {employees.map((employee) => (
                  <Card
                    key={employee.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleEmployeeSelect(employee)}
                  >
                    <CardContent className="py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{employee.name}</h3>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date Selection */}
        {currentStep === STEPS.SELECT_DATE && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Select a Date</h2>
                <p className="text-gray-600 mt-1">
                  Service: <span className="font-medium">{selectedService?.name}</span>
                  {selectedEmployee && (
                    <> with <span className="font-medium">{selectedEmployee.name}</span></>
                  )}
                </p>
              </div>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardContent className="flex justify-center py-8">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Time Selection */}
        {currentStep === STEPS.SELECT_TIME && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Select a Time</h2>
                <p className="text-gray-600 mt-1">
                  {selectedService?.name}
                  {selectedEmployee && <> with {selectedEmployee.name}</>}
                  {' '}on {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                </p>
              </div>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardContent className="py-6">
                {slotsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No available time slots for this date. Please select a different date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.startTime}
                        variant={slot.available ? "outline" : "ghost"}
                        className={`h-auto py-3 ${!slot.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                        onClick={() => slot.available && handleTimeSlotSelect(slot)}
                        disabled={!slot.available}
                      >
                        <div className="text-center">
                          <div className="font-semibold">{slot.startTime}</div>
                          <div className="text-xs text-gray-600">to {slot.endTime}</div>
                          {!slot.available && slot.isPast && (
                            <div className="text-xs text-gray-500 mt-1">Passed</div>
                          )}
                          {!slot.available && !slot.isPast && (
                            <div className="text-xs text-red-600 mt-1">Booked</div>
                          )}
                          {slot.available && slot.spotsLeft && slot.spotsLeft !== 'unlimited' && (
                            <div className="text-xs text-green-600 mt-1">
                              {slot.spotsLeft} spot{slot.spotsLeft !== 1 ? 's' : ''} left
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Client Information */}
        {currentStep === STEPS.CLIENT_INFO && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Information</h2>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={clientInfo.firstName}
                      onChange={(e) => handleClientInfoChange('firstName', e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={clientInfo.lastName}
                      onChange={(e) => handleClientInfoChange('lastName', e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => handleClientInfoChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={clientInfo.notes}
                    onChange={(e) => handleClientInfoChange('notes', e.target.value)}
                    placeholder="Any special requests or information..."
                    rows={4}
                  />
                </div>
                {/* Honeypot field - hidden from real users, catches bots */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    opacity: 0,
                    height: 0,
                    overflow: 'hidden',
                  }}
                >
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={clientInfo.website}
                    onChange={(e) => handleClientInfoChange('website', e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <Button className="w-full" onClick={handleClientInfoSubmit}>
                  Continue to Confirmation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 6: Confirmation */}
        {currentStep === STEPS.CONFIRM && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Confirm Your Booking</h2>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Review Your Appointment</CardTitle>
                <CardDescription>Please verify all details before confirming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Business
                  </h3>
                  <p className="text-gray-700">{business?.businessName}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Service
                  </h3>
                  <p className="text-gray-700">{selectedService?.name}</p>
                  <p className="text-sm text-gray-600">
                    Duration: {selectedService?.duration} minutes
                    {selectedService?.price && ` • Price: $${selectedService.price}`}
                  </p>
                </div>
                {selectedEmployee && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Staff Member
                    </h3>
                    <p className="text-gray-700">{selectedEmployee.name}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date & Time
                  </h3>
                  <p className="text-gray-700">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Information
                  </h3>
                  <p className="text-gray-700">
                    {clientInfo.firstName} {clientInfo.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{clientInfo.email}</p>
                  <p className="text-sm text-gray-600">{clientInfo.phone}</p>
                  {clientInfo.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Notes:</span> {clientInfo.notes}
                    </p>
                  )}
                </div>
                <div className="border-t pt-4">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConfirmBooking}
                    disabled={submitting}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 7: Success */}
        {currentStep === STEPS.SUCCESS && (
          <div>
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">
                  {bookingResult?.status === 'CONFIRMED' ? 'Booking Confirmed!' : 'Booking Received!'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {bookingResult?.status === 'CONFIRMED'
                    ? 'Your appointment has been confirmed and is scheduled.'
                    : 'Your appointment request has been submitted.'}
                </p>

                {/* Email Confirmation Required */}
                {bookingResult?.requiresEmailConfirmation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <p className="font-semibold text-blue-900 mb-1">Email Confirmation Required</p>
                    <p className="text-blue-800 text-sm">
                      Please check your email and click the confirmation link to verify your booking.
                      {bookingResult?.status === 'PENDING' && ' After email verification, the business will review your appointment.'}
                    </p>
                    {bookingResult?.confirmationTimeoutMinutes > 0 && (
                      <p className="text-amber-700 text-sm font-medium mt-2">
                        ⏰ You must confirm within {bookingResult.confirmationTimeoutMinutes} minutes or your appointment will be automatically cancelled.
                      </p>
                    )}
                  </div>
                )}

                {/* Business Approval Required (no email confirmation) */}
                {!bookingResult?.requiresEmailConfirmation && bookingResult?.status === 'PENDING' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <p className="font-semibold text-yellow-900 mb-1">Pending Business Approval</p>
                    <p className="text-yellow-800 text-sm">
                      Your appointment is pending review by the business. You will receive a confirmation email once approved.
                    </p>
                  </div>
                )}

                {/* Confirmed Instantly */}
                {bookingResult?.status === 'CONFIRMED' && !bookingResult?.requiresEmailConfirmation && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <p className="font-semibold text-green-900 mb-1">Appointment Confirmed</p>
                    <p className="text-green-800 text-sm">
                      Your appointment is confirmed! You will receive a reminder email before your scheduled time.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-semibold mb-3">Appointment Details</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Service:</span> {selectedService?.name}
                    </p>
                    {selectedEmployee && (
                      <p>
                        <span className="font-medium">Staff:</span> {selectedEmployee.name}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Date:</span>{' '}
                      {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {selectedTimeSlot?.startTime} -{' '}
                      {selectedTimeSlot?.endTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <StatusBadge status={bookingResult?.status || 'PENDING'} size="sm" />
                    </p>
                  </div>
                </div>

                <Button onClick={handleStartOver}>Book Another Appointment</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
