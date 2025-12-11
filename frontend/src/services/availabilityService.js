import api from './api';

/**
 * Availability API functions for managing business availability and schedules
 */

// ==================== WORKING HOURS ====================

/**
 * Get all working hours for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of working hours by day
 */
export const getAvailability = async (businessId) => {
  const response = await api.get(`/availability/business/${businessId}`);
  return response.data;
};

/**
 * Create working hours for a specific day
 * @param {string} businessId - Business ID
 * @param {Object} availabilityData - Availability data (dayOfWeek, startTime, endTime, isAvailable, capacityOverride)
 * @returns {Promise} - Created availability
 */
export const createAvailability = async (businessId, availabilityData) => {
  const response = await api.post(`/availability/business/${businessId}`, availabilityData);
  return response.data;
};

/**
 * Update working hours
 * @param {string} availabilityId - Availability ID
 * @param {Object} availabilityData - Updated availability data
 * @returns {Promise} - Updated availability
 */
export const updateAvailability = async (availabilityId, availabilityData) => {
  const response = await api.put(`/availability/${availabilityId}`, availabilityData);
  return response.data;
};

/**
 * Delete working hours
 * @param {string} availabilityId - Availability ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteAvailability = async (availabilityId) => {
  const response = await api.delete(`/availability/${availabilityId}`);
  return response.data;
};

// ==================== BREAKS ====================

/**
 * Get all breaks for a specific availability/day
 * @param {string} availabilityId - Availability ID
 * @returns {Promise} - List of breaks
 */
export const getBreaks = async (availabilityId) => {
  const response = await api.get(`/availability/${availabilityId}/breaks`);
  return response.data;
};

/**
 * Create a break period
 * @param {string} availabilityId - Availability ID
 * @param {Object} breakData - Break data (breakStart, breakEnd)
 * @returns {Promise} - Created break
 */
export const createBreak = async (availabilityId, breakData) => {
  const response = await api.post(`/availability/${availabilityId}/breaks`, breakData);
  return response.data;
};

/**
 * Update a break period
 * @param {string} availabilityId - Availability ID
 * @param {string} breakId - Break ID
 * @param {Object} breakData - Updated break data
 * @returns {Promise} - Updated break
 */
export const updateBreak = async (availabilityId, breakId, breakData) => {
  const response = await api.put(`/availability/${availabilityId}/breaks/${breakId}`, breakData);
  return response.data;
};

/**
 * Delete a break period
 * @param {string} availabilityId - Availability ID
 * @param {string} breakId - Break ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteBreak = async (availabilityId, breakId) => {
  const response = await api.delete(`/availability/${availabilityId}/breaks/${breakId}`);
  return response.data;
};

// ==================== SPECIAL DATES ====================

/**
 * Get all special dates for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of special dates
 */
export const getSpecialDates = async (businessId) => {
  const response = await api.get(`/special-dates/business/${businessId}`);
  return response.data;
};

/**
 * Create a special date/exception
 * @param {string} businessId - Business ID
 * @param {Object} specialDateData - Special date data (date, isAvailable, startTime, endTime, capacityOverride, reason)
 * @returns {Promise} - Created special date
 */
export const createSpecialDate = async (businessId, specialDateData) => {
  const response = await api.post(`/special-dates/business/${businessId}`, specialDateData);
  return response.data;
};

/**
 * Update a special date
 * @param {string} specialDateId - Special date ID
 * @param {Object} specialDateData - Updated special date data
 * @returns {Promise} - Updated special date
 */
export const updateSpecialDate = async (specialDateId, specialDateData) => {
  const response = await api.put(`/special-dates/${specialDateId}`, specialDateData);
  return response.data;
};

/**
 * Delete a special date
 * @param {string} specialDateId - Special date ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteSpecialDate = async (specialDateId) => {
  const response = await api.delete(`/special-dates/${specialDateId}`);
  return response.data;
};

export default {
  // Working Hours
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  // Breaks
  getBreaks,
  createBreak,
  updateBreak,
  deleteBreak,
  // Special Dates
  getSpecialDates,
  createSpecialDate,
  updateSpecialDate,
  deleteSpecialDate,
};
