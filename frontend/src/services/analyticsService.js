import api from './api';

/**
 * Get analytics overview
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Analytics overview data
 */
export const getAnalyticsOverview = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const response = await api.get(`/analytics/overview?${queryParams}`);
  return response.data;
};

/**
 * Get booking trends over time
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.groupBy - Grouping: 'day', 'week', or 'month'
 * @returns {Promise} - Booking trends data
 */
export const getBookingTrends = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.groupBy) queryParams.append('groupBy', params.groupBy);
  
  const response = await api.get(`/analytics/trends?${queryParams}`);
  return response.data;
};

/**
 * Get popular days of the week
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Popular days data
 */
export const getPopularDays = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const response = await api.get(`/analytics/popular-days?${queryParams}`);
  return response.data;
};

/**
 * Get popular time slots
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Popular time slots data
 */
export const getPopularTimeSlots = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const response = await api.get(`/analytics/popular-times?${queryParams}`);
  return response.data;
};

/**
 * Get service performance analytics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise} - Service performance data
 */
export const getServicePerformance = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  const response = await api.get(`/analytics/services?${queryParams}`);
  return response.data;
};

/**
 * Export analytics data as CSV
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @param {string} params.type - Export type: 'appointments'
 * @returns {Promise} - CSV blob
 */
export const exportAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.type) queryParams.append('type', params.type);
  
  const response = await api.get(`/analytics/export?${queryParams}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Download exported CSV file
 * @param {Blob} blob - CSV blob data
 * @param {string} filename - File name for download
 */
export const downloadCSV = (blob, filename = 'analytics-export.csv') => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
