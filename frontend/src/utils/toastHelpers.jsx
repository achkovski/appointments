import { toast } from '../hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, Info, Calendar, Bell } from 'lucide-react';

/**
 * Toast helper utilities with consistent styling
 * Use these instead of raw toast() calls for a better UX
 */

/**
 * Success toast with green checkmark icon
 */
export const toastSuccess = (title, description) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>{title}</span>
      </div>
    ),
    description: description && (
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    ),
    duration: 4000,
  });
};

/**
 * Error toast with red X icon
 */
export const toastError = (title, description) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-500" />
        <span>{title}</span>
      </div>
    ),
    description: description && (
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    ),
    variant: 'destructive',
    duration: 5000,
  });
};

/**
 * Warning toast with yellow alert icon
 */
export const toastWarning = (title, description) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <span>{title}</span>
      </div>
    ),
    description: description && (
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    ),
    duration: 5000,
  });
};

/**
 * Info toast with blue info icon
 */
export const toastInfo = (title, description) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-blue-500" />
        <span>{title}</span>
      </div>
    ),
    description: description && (
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    ),
    duration: 4000,
  });
};

/**
 * Appointment toast with calendar icon (for booking-related notifications)
 */
export const toastAppointment = (title, clientName, serviceName, date, time) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-green-500" />
        <span>{title}</span>
      </div>
    ),
    description: (
      <div className="mt-1">
        <p className="font-medium">{clientName}</p>
        <p className="text-sm text-muted-foreground">
          {serviceName} - {date} at {time}
        </p>
      </div>
    ),
    duration: 5000,
  });
};

/**
 * Notification toast with bell icon
 */
export const toastNotification = (title, description) => {
  toast({
    title: (
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-blue-500" />
        <span>{title}</span>
      </div>
    ),
    description: description && (
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
    ),
    duration: 4000,
  });
};

export default {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  appointment: toastAppointment,
  notification: toastNotification,
};
