import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock, Ban, Zap } from 'lucide-react';

/**
 * Consistent status badge component for appointments
 * Used across Appointments list, AppointmentDetail, and BookingPage
 */
const StatusBadge = ({ status, showIcon = true, size = 'default', completedAutomatically = false, cancellationReason = null }) => {
  const statusUpper = status?.toUpperCase();

  const statusConfig = {
    CONFIRMED: {
      variant: 'default',
      label: 'Confirmed',
      icon: CheckCircle,
      className: 'bg-green-500 hover:bg-green-600 text-white',
    },
    PENDING: {
      variant: 'secondary',
      label: 'Pending',
      icon: AlertCircle,
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    CANCELLED: {
      variant: 'destructive',
      label: 'Cancelled',
      icon: XCircle,
      className: 'bg-red-500 hover:bg-red-600 text-white',
    },
    CANCELLED_AUTO: {
      variant: 'outline',
      label: 'Auto-Cancelled',
      icon: Zap,
      className: 'bg-orange-50 text-orange-700 border-orange-300',
    },
    COMPLETED: {
      variant: 'outline',
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    COMPLETED_AUTO: {
      variant: 'outline',
      label: 'Auto-Completed',
      icon: Zap,
      className: 'bg-blue-50 text-blue-700 border-blue-300',
    },
    NO_SHOW: {
      variant: 'outline',
      label: 'No Show',
      icon: Ban,
      className: 'bg-gray-100 text-gray-500 border-gray-300',
    },
  };

  // Detect auto-cancelled appointments
  const isAutoCancelled = statusUpper === 'CANCELLED' &&
    cancellationReason &&
    cancellationReason.includes('Automatically cancelled');

  // Use auto-completed config if status is COMPLETED and was auto-completed
  // Use auto-cancelled config if status is CANCELLED and was auto-cancelled
  let configKey = statusUpper;
  if (statusUpper === 'COMPLETED' && completedAutomatically) {
    configKey = 'COMPLETED_AUTO';
  } else if (isAutoCancelled) {
    configKey = 'CANCELLED_AUTO';
  }

  const config = statusConfig[configKey] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === 'sm' ? 'text-xs' : ''}`}>
      {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
