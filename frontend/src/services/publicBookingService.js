import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a public axios instance without auth headers
const publicApi = axios.create({
  baseURL: `${API_URL}/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get business information and services by slug
 * @param {string} slug - Business slug
 * @returns {Promise} Business data with services
 */
export const getBusinessBySlug = async (slug) => {
  const response = await publicApi.get(`/business/${slug}`);
  return response.data;
};

/**
 * Get available time slots for a specific date and service
 * @param {string} businessSlug - Business slug
 * @param {string} serviceId - Service ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} Available slots data
 */
export const getAvailableSlots = async (businessSlug, serviceId, date) => {
  const response = await publicApi.post('/available-slots', {
    businessSlug,
    serviceId,
    date,
  });
  return response.data;
};

/**
 * Get available slots for a date range
 * @param {string} businessSlug - Business slug
 * @param {string} serviceId - Service ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise} Available slots for range
 */
export const getAvailableSlotsRange = async (businessSlug, serviceId, startDate, endDate) => {
  const response = await publicApi.post('/available-slots-range', {
    businessSlug,
    serviceId,
    startDate,
    endDate,
  });
  return response.data;
};

/**
 * Create a guest appointment (public booking)
 * @param {Object} bookingData - Booking details
 * @returns {Promise} Created appointment data
 */
export const createBooking = async (bookingData) => {
  const response = await publicApi.post('/book', bookingData);
  return response.data;
};

/**
 * Confirm appointment via email token
 * @param {string} token - Email confirmation token
 * @returns {Promise} Confirmation result
 */
export const confirmAppointment = async (token) => {
  const response = await publicApi.post('/confirm-appointment', { token });
  return response.data;
};

/**
 * Cancel appointment by client
 * @param {string} appointmentId - Appointment ID
 * @param {string} email - Client email (for verification)
 * @param {string} cancellationReason - Optional reason for cancellation
 * @returns {Promise} Cancellation result
 */
export const cancelAppointment = async (appointmentId, email, cancellationReason = '') => {
  const response = await publicApi.post('/cancel-appointment', {
    appointmentId,
    email,
    cancellationReason,
  });
  return response.data;
};

export default {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange,
  createBooking,
  confirmAppointment,
  cancelAppointment,
};
