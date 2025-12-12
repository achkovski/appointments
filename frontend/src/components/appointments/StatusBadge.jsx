import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock, Ban } from 'lucide-react';

/**
 * Consistent status badge component for appointments
 * Used across Appointments list, AppointmentDetail, and BookingPage
 */
const StatusBadge = ({ status, showIcon = true, size = 'default' }) => {
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
    COMPLETED: {
      variant: 'outline',
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    NO_SHOW: {
      variant: 'outline',
      label: 'No Show',
      icon: Ban,
      className: 'bg-gray-100 text-gray-500 border-gray-300',
    },
  };

  const config = statusConfig[statusUpper] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${size === 'sm' ? 'text-xs' : ''}`}>
      {showIcon && <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
