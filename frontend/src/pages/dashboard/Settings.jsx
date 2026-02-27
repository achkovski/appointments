import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Settings as SettingsIcon,
  Bell,
  Clock,
  User,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  Zap,
  Trash2,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { updateBusiness } from '../../services/businessService';
import { updateUser, changePassword, deleteAccount } from '../../services/authService';
import { triggerAutoComplete } from '../../services/appointmentsService';

const TIME_SLOT_OPTIONS = [15, 30, 45, 60];
const BOOKING_NOTICE_OPTIONS = [
  { value: 0, label: 'No minimum' },
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 4, label: '4 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day' },
  { value: 48, label: '2 days' },
];
const ADVANCE_BOOKING_OPTIONS = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  { value: 180, label: '6 months' },
];
const AUTO_COMPLETE_GRACE_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '24 hours' },
  { value: 48, label: '48 hours' },
  { value: 72, label: '72 hours' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { business, loading: businessLoading, updateBusiness: updateBusinessContext } = useBusiness();
  const { user, updateUser: updateUserContext, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Booking Settings
  const [bookingSettings, setBookingSettings] = useState({
    autoConfirm: true,
    requireEmailConfirmation: false,
    emailConfirmationTimeout: 15,
    allowEmployeeBooking: false,
    bufferTime: 0,
    minBookingNotice: 2,
    maxAdvanceBooking: 30,
    cancellationNotice: 24,
    maxAppointmentsPerDay: 0,
    autoCompleteAppointments: false,
    autoCompleteGraceHours: 24,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewBooking: true,
    emailOnCancellation: true,
    emailOnReschedule: true,
    sendReminders: true,
    reminderHours: 24,
  });

  // Time Slot Settings
  const [timeSlotSettings, setTimeSlotSettings] = useState({
    defaultTimeSlot: 30,
  });

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  // Advanced Settings
  const [advancedSettings, setAdvancedSettings] = useState({
    autoRedirectToDashboard: false,
  });

  // Auto-complete state
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  const [autoCompleteResult, setAutoCompleteResult] = useState(null);

  useEffect(() => {
    if (business) {
      const settings = business.settings || {};
      setBookingSettings({
        autoConfirm: settings.autoConfirm ?? true,
        requireEmailConfirmation: settings.requireEmailConfirmation ?? false,
        emailConfirmationTimeout: settings.emailConfirmationTimeout ?? 15,
        allowEmployeeBooking: settings.allowEmployeeBooking ?? false,
        bufferTime: settings.bufferTime ?? 0,
        minBookingNotice: settings.minBookingNotice ?? 2,
        maxAdvanceBooking: settings.maxAdvanceBooking ?? 30,
        cancellationNotice: settings.cancellationNotice ?? 24,
        maxAppointmentsPerDay: settings.maxAppointmentsPerDay ?? 0,
        autoCompleteAppointments: settings.autoCompleteAppointments ?? false,
        autoCompleteGraceHours: settings.autoCompleteGraceHours ?? 24,
      });
      setNotificationSettings({
        emailOnNewBooking: settings.emailOnNewBooking ?? true,
        emailOnCancellation: settings.emailOnCancellation ?? true,
        emailOnReschedule: settings.emailOnReschedule ?? true,
        sendReminders: settings.sendReminders ?? true,
        reminderHours: settings.reminderHours ?? 24,
      });
      setTimeSlotSettings({
        defaultTimeSlot: settings.defaultTimeSlot ?? 30,
      });
    }
  }, [business]);

  useEffect(() => {
    if (user) {
      setAccountSettings({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setAdvancedSettings({
        autoRedirectToDashboard: user.settings?.autoRedirectToDashboard ?? false,
      });
    }
  }, [user]);

  const handleBookingSettingChange = (field, value) => {
    setBookingSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationSettingChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTimeSlotSettingChange = (field, value) => {
    setTimeSlotSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAccountSettingChange = (field, value) => {
    setAccountSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAdvancedSettingChange = (field, value) => {
    setAdvancedSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updatedSettings = {
        ...bookingSettings,
        ...notificationSettings,
        ...timeSlotSettings,
      };

      const response = await updateBusiness(business.id, { settings: updatedSettings });
      await updateBusinessContext(response.business || response);

      setHasChanges(false);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccountSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await updateUser(user.id, {
        firstName: accountSettings.firstName,
        lastName: accountSettings.lastName,
        email: accountSettings.email,
        phone: accountSettings.phone,
      });

      await updateUserContext(response.user || response);

      setHasChanges(false);
      setSuccess('Account information updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating account:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update account information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdvancedSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await updateUser(user.id, {
        settings: advancedSettings,
      });

      await updateUserContext(response.user || response);

      setHasChanges(false);
      setSuccess('Advanced settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating advanced settings:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update advanced settings');
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordChange = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordChange()) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAutoComplete = async () => {
    try {
      setAutoCompleteLoading(true);
      setAutoCompleteResult(null);
      setError(null);

      const result = await triggerAutoComplete();

      setAutoCompleteResult(result);

      // Build success message based on what was processed
      const messages = [];
      if (result.completed > 0) {
        messages.push(`${result.completed} confirmed appointment(s) auto-completed`);
      }
      if (result.cancelled > 0) {
        messages.push(`${result.cancelled} pending appointment(s) auto-cancelled`);
      }

      if (messages.length > 0) {
        setSuccess(`Successfully processed: ${messages.join(' and ')}`);
      } else {
        setSuccess('No appointments to process');
      }

      setTimeout(() => {
        setSuccess(null);
        setAutoCompleteResult(null);
      }, 5000);
    } catch (err) {
      console.error('Error running auto-complete:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to run auto-complete');
    } finally {
      setAutoCompleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteAccount(deletePassword);
      await logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your application preferences
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 border border-green-500 bg-green-50 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Booking Settings
            </CardTitle>
            <CardDescription>
              Configure how appointments are booked
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Require email confirmation</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, clients must verify their email before the appointment is processed.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingSettings.requireEmailConfirmation}
                  onChange={(e) => handleBookingSettingChange('requireEmailConfirmation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {bookingSettings.requireEmailConfirmation && (
              <div className="space-y-2 ml-4 pl-4 border-l-2 border-primary/20">
                <Label htmlFor="emailConfirmationTimeout">Email Confirmation Timeout (minutes)</Label>
                <Input
                  id="emailConfirmationTimeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={bookingSettings.emailConfirmationTimeout}
                  onChange={(e) => handleBookingSettingChange('emailConfirmationTimeout', parseInt(e.target.value) || 15)}
                />
                <p className="text-sm text-muted-foreground">
                  If a client does not confirm their email within this time, the appointment will be automatically cancelled and the slot will be freed up. Default: 15 minutes.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Auto-confirm appointments</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, appointments are automatically confirmed after email verification (or immediately if email confirmation is disabled). When disabled, you must manually confirm each appointment.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingSettings.autoConfirm}
                  onChange={(e) => handleBookingSettingChange('autoConfirm', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Allow employee booking</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, clients can choose a specific employee when booking. Employees must be assigned to services to appear as options.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingSettings.allowEmployeeBooking}
                  onChange={(e) => handleBookingSettingChange('allowEmployeeBooking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bufferTime">Buffer Time Between Appointments (minutes)</Label>
              <Input
                id="bufferTime"
                type="number"
                min="0"
                max="120"
                step="5"
                value={bookingSettings.bufferTime}
                onChange={(e) => handleBookingSettingChange('bufferTime', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Additional time between appointments for preparation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minBookingNotice">Minimum Booking Notice</Label>
              <select
                id="minBookingNotice"
                value={bookingSettings.minBookingNotice}
                onChange={(e) => handleBookingSettingChange('minBookingNotice', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {BOOKING_NOTICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                How soon in advance clients can book appointments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdvanceBooking">Maximum Advance Booking</Label>
              <select
                id="maxAdvanceBooking"
                value={bookingSettings.maxAdvanceBooking}
                onChange={(e) => handleBookingSettingChange('maxAdvanceBooking', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ADVANCE_BOOKING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                How far in advance clients can book appointments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationNotice">Cancellation Notice Period (hours)</Label>
              <Input
                id="cancellationNotice"
                type="number"
                min="0"
                max="168"
                value={bookingSettings.cancellationNotice}
                onChange={(e) => handleBookingSettingChange('cancellationNotice', parseInt(e.target.value) || 0)}
                placeholder="24"
              />
              <p className="text-xs text-muted-foreground">
                Minimum notice required for cancellations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAppointmentsPerDay">Maximum Appointments Per Day</Label>
              <Input
                id="maxAppointmentsPerDay"
                type="number"
                min="0"
                value={bookingSettings.maxAppointmentsPerDay}
                onChange={(e) => handleBookingSettingChange('maxAppointmentsPerDay', parseInt(e.target.value) || 0)}
                placeholder="0 (unlimited)"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 for unlimited appointments
              </p>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Appointment Automation</h3>

              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="font-medium">Auto-complete & Auto-cancel Past Appointments</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark confirmed appointments as completed and cancel pending appointments after they pass. This keeps your appointment list clean and analytics accurate.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingSettings.autoCompleteAppointments}
                    onChange={(e) => handleBookingSettingChange('autoCompleteAppointments', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {bookingSettings.autoCompleteAppointments && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="autoCompleteGraceHours">Grace Period</Label>
                    <select
                      id="autoCompleteGraceHours"
                      value={bookingSettings.autoCompleteGraceHours}
                      onChange={(e) => handleBookingSettingChange('autoCompleteGraceHours', parseInt(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {AUTO_COMPLETE_GRACE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      How long after an appointment ends before it's automatically processed. Confirmed appointments are marked completed, pending appointments are cancelled. This gives you time to manually handle no-shows or late confirmations.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRunAutoComplete}
                      disabled={autoCompleteLoading || hasChanges}
                    >
                      {autoCompleteLoading ? 'Running...' : 'Run Now'}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {hasChanges
                        ? 'Save settings first to run automation'
                        : 'Manually process all eligible past appointments now (completes confirmed, cancels pending)'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Booking Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Manage email and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Email on new booking</p>
                <p className="text-sm text-muted-foreground">
                  Receive email when a new appointment is booked
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnNewBooking}
                  onChange={(e) => handleNotificationSettingChange('emailOnNewBooking', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Email on cancellation</p>
                <p className="text-sm text-muted-foreground">
                  Receive email when an appointment is cancelled
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnCancellation}
                  onChange={(e) => handleNotificationSettingChange('emailOnCancellation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Email on reschedule</p>
                <p className="text-sm text-muted-foreground">
                  Receive email when an appointment is rescheduled
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.emailOnReschedule}
                  onChange={(e) => handleNotificationSettingChange('emailOnReschedule', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Send appointment reminders</p>
                <p className="text-sm text-muted-foreground">
                  Automatically send reminder emails to clients
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sendReminders}
                  onChange={(e) => handleNotificationSettingChange('sendReminders', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {notificationSettings.sendReminders && (
              <div className="space-y-2">
                <Label htmlFor="reminderHours">Reminder Time (hours before appointment)</Label>
                <Input
                  id="reminderHours"
                  type="number"
                  min="1"
                  max="168"
                  value={notificationSettings.reminderHours}
                  onChange={(e) => handleNotificationSettingChange('reminderHours', parseInt(e.target.value) || 24)}
                  placeholder="24"
                />
                <p className="text-xs text-muted-foreground">
                  How many hours before the appointment to send reminders
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button onClick={handleSaveSettings} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Time Slot Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Slot Configuration
            </CardTitle>
            <CardDescription>
              Set default time slot intervals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTimeSlot">Default Time Slot Interval (minutes)</Label>
              <select
                id="defaultTimeSlot"
                value={timeSlotSettings.defaultTimeSlot}
                onChange={(e) => handleTimeSlotSettingChange('defaultTimeSlot', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TIME_SLOT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} minutes
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Default interval for available time slots in booking calendar
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Time Slot Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Update your account information and password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={accountSettings.firstName}
                  onChange={(e) => handleAccountSettingChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={accountSettings.lastName}
                  onChange={(e) => handleAccountSettingChange('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accountEmail"
                  type="email"
                  value={accountSettings.email}
                  disabled
                  className="pl-10 bg-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountPhone">Phone Number</Label>
              <Input
                id="accountPhone"
                value={accountSettings.phone}
                onChange={(e) => handleAccountSettingChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveAccountSettings} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Account Information'}
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="off"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <Button onClick={handleChangePassword} disabled={loading} variant="outline">
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Power user options and customizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">Auto-redirect to dashboard</p>
                <p className="text-sm text-muted-foreground">
                  When enabled, you'll be automatically redirected to your dashboard when visiting the homepage.
                  By default, the homepage remains accessible so you can view updates, announcements, and your booking page link.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedSettings.autoRedirectToDashboard}
                  onChange={(e) => handleAdvancedSettingChange('autoRedirectToDashboard', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveAdvancedSettings} disabled={!hasChanges || loading}>
                {loading ? 'Saving...' : 'Save Advanced Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
              <p className="font-medium text-sm">This action is irreversible. Deleting your account will permanently remove:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Your account and login credentials</li>
                <li>Your business profile and all settings</li>
                <li>All appointments, services, and employees</li>
                <li>All analytics and scheduling data</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete My Account
              </Button>
            ) : (
              <div className="space-y-4 pt-2">
                <p className="text-sm font-medium">Enter your password to confirm deletion:</p>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Your current password"
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeleteError(null);
                    }}
                    className="border-destructive focus-visible:ring-destructive"
                    autoComplete="current-password"
                  />
                  {deleteError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {deleteError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteError(null);
                    }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
