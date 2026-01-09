import { useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { toast } from '../../hooks/use-toast';
import { Calendar, Bell } from 'lucide-react';

// Custom event names for cross-component communication
export const REFRESH_EVENTS = {
  APPOINTMENTS: 'refresh:appointments',
  OVERVIEW: 'refresh:overview',
};

/**
 * Dispatch a custom refresh event that components can listen to
 */
export const dispatchRefreshEvent = (eventName, data = {}) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
};

/**
 * Hook to listen for refresh events
 * @param {string} eventName - The event to listen for
 * @param {function} callback - Callback when event fires
 */
export const useRefreshListener = (eventName, callback) => {
  useEffect(() => {
    const handler = (event) => callback(event.detail);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, callback]);
};

/**
 * NotificationListener component
 * Listens for real-time socket events and shows toast notifications
 * Also triggers data refresh when on relevant pages
 */
const NotificationListener = () => {
  const { subscribe, isConnected } = useSocket();

  // Handle new appointment created
  const handleAppointmentCreated = useCallback((data) => {
    console.log('🔔 New appointment received:', data);

    // Show toast notification
    toast({
      title: (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-green-500" />
          <span>New Appointment Booked</span>
        </div>
      ),
      description: (
        <div className="mt-1">
          <p className="font-medium">{data.appointment?.clientName}</p>
          <p className="text-sm text-muted-foreground">
            {data.appointment?.serviceName} - {data.appointment?.appointmentDate} at {data.appointment?.startTime}
          </p>
        </div>
      ),
      duration: 5000,
    });

    // Dispatch refresh events for components to listen to
    dispatchRefreshEvent(REFRESH_EVENTS.APPOINTMENTS, data);
    dispatchRefreshEvent(REFRESH_EVENTS.OVERVIEW, data);
  }, []);

  // Handle appointment status updated
  const handleAppointmentUpdated = useCallback((data) => {
    console.log('🔔 Appointment updated:', data);

    // Only show toast for significant status changes
    if (data.type === 'status_change') {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" />
            <span>Appointment Updated</span>
          </div>
        ),
        description: data.message || `Status changed to ${data.newStatus}`,
        duration: 4000,
      });
    }

    // Dispatch refresh events
    dispatchRefreshEvent(REFRESH_EVENTS.APPOINTMENTS, data);
    dispatchRefreshEvent(REFRESH_EVENTS.OVERVIEW, data);
  }, []);

  // Subscribe to socket events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCreated = subscribe('appointment:created', handleAppointmentCreated);
    const unsubscribeUpdated = subscribe('appointment:updated', handleAppointmentUpdated);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [isConnected, subscribe, handleAppointmentCreated, handleAppointmentUpdated]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationListener;
