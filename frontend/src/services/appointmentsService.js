import api from './api';

/**
 * Get all appointments for a business
 * @param {string} businessId - Business ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise} - List of appointments
 */
export const getAppointments = async (businessId, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await api.get(`/appointments/business/${businessId}?${params}`);
  return response.data;
};

/**
 * Get single appointment by ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} - Appointment details
 */
export const getAppointment = async (appointmentId) => {
  const response = await api.get(`/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Create new appointment (manual)
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise} - Created appointment
 */
export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

/**
 * Reschedule appointment
 * @param {string} appointmentId - Appointment ID
 * @param {Object} appointmentData - Reschedule data (appointmentDate, startTime, serviceId)
 * @returns {Promise} - Updated appointment
 */
export const updateAppointment = async (appointmentId, appointmentData) => {
  const response = await api.put(`/appointments/${appointmentId}/reschedule`, appointmentData);
  return response.data;
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status
 * @returns {Promise} - Updated appointment
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  const response = await api.put(`/appointments/${appointmentId}/status`, { status });
  return response.data;
};

/**
 * Update appointment notes
 * @param {string} appointmentId - Appointment ID
 * @param {string} notes - Notes text
 * @returns {Promise} - Updated appointment
 */
export const updateAppointmentNotes = async (appointmentId, notes) => {
  const response = await api.put(`/appointments/${appointmentId}/notes`, { notes });
  return response.data;
};

/**
 * Confirm appointment
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise} - Confirmed appointment
 */
export const confirmAppointment = async (appointmentId) => {
  const response = await api.put(`/appointments/${appointmentId}/confirm`);
  return response.data;
};

/**
 * Cancel appointment
 * @param {string} appointmentId - Appointment ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise} - Cancellation confirmation
 */
export const cancelAppointment = async (appointmentId, reason) => {
  const response = await api.put(`/appointments/${appointmentId}/status`, {
    status: 'CANCELLED',
    cancellationReason: reason,
  });
  return response.data;
};

/**
 * Get upcoming appointments for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of upcoming appointments
 */
export const getUpcomingAppointments = async (businessId) => {
  const response = await api.get(`/appointments/upcoming?businessId=${businessId}`);
  return response.data;
};

/**
 * Get past appointments for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of past appointments
 */
export const getPastAppointments = async (businessId) => {
  const response = await api.get(`/appointments/past?businessId=${businessId}`);
  return response.data;
};

/**
 * Get available time slots for a specific date and service
 * @param {string} businessSlug - Business slug
 * @param {string} serviceId - Service ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} - Available slots data
 */
export const getAvailableSlots = async (businessSlug, serviceId, date) => {
  const response = await api.post('/public/available-slots', {
    businessSlug,
    serviceId,
    date,
  });
  return response.data;
};

/**
 * Send contact email to client
 * @param {string} appointmentId - Appointment ID
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @returns {Promise} - Send result
 */
export const contactClient = async (appointmentId, subject, message) => {
  const response = await api.post(`/appointments/${appointmentId}/contact`, {
    subject,
    message,
  });
  return response.data;
};

/**
 * Reassign appointment to a different employee
 * @param {string} appointmentId - Appointment ID
 * @param {string} employeeId - New employee ID
 * @returns {Promise} - Reassignment result
 */
export const reassignAppointment = async (appointmentId, employeeId) => {
  const response = await api.put(`/appointments/${appointmentId}/reassign`, { employeeId });
  return response.data;
};

/**
 * Manually trigger auto-complete for past appointments
 * @returns {Promise} - Result with count of completed appointments
 */
export const triggerAutoComplete = async () => {
  const response = await api.post('/appointments/auto-complete');
  return response.data;
};

export default {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  updateAppointmentNotes,
  confirmAppointment,
  cancelAppointment,
  reassignAppointment,
  getUpcomingAppointments,
  getPastAppointments,
  getAvailableSlots,
  contactClient,
  triggerAutoComplete,
};
