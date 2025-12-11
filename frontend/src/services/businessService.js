import api from './api';

/**
 * Business API functions for managing business profiles
 */

/**
 * Get all businesses (admin only)
 * @returns {Promise} - List of businesses
 */
export const getAllBusinesses = async () => {
  const response = await api.get('/businesses');
  return response.data;
};

/**
 * Get a single business by ID
 * @param {string} businessId - Business ID
 * @returns {Promise} - Business details
 */
export const getBusiness = async (businessId) => {
  const response = await api.get(`/businesses/${businessId}`);
  return response.data;
};

/**
 * Get business by slug (public)
 * @param {string} slug - Business slug/URL
 * @returns {Promise} - Business details
 */
export const getBusinessBySlug = async (slug) => {
  const response = await api.get(`/businesses/slug/${slug}`);
  return response.data;
};

/**
 * Create a new business
 * @param {Object} businessData - Business data
 * @returns {Promise} - Created business
 */
export const createBusiness = async (businessData) => {
  const response = await api.post('/businesses', businessData);
  return response.data;
};

/**
 * Update business profile
 * @param {string} businessId - Business ID
 * @param {Object} businessData - Updated business data
 * @returns {Promise} - Updated business
 */
export const updateBusiness = async (businessId, businessData) => {
  const response = await api.put(`/businesses/${businessId}`, businessData);
  return response.data;
};

/**
 * Delete a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteBusiness = async (businessId) => {
  const response = await api.delete(`/businesses/${businessId}`);
  return response.data;
};

/**
 * Generate QR code for business booking page
 * @param {string} businessId - Business ID
 * @returns {Promise} - QR code URL
 */
export const generateQRCode = async (businessId) => {
  const response = await api.post(`/businesses/${businessId}/qr-code`);
  return response.data;
};

/**
 * Get business settings
 * @param {string} businessId - Business ID
 * @returns {Promise} - Business settings
 */
export const getBusinessSettings = async (businessId) => {
  const response = await api.get(`/businesses/${businessId}/settings`);
  return response.data;
};

/**
 * Update business settings
 * @param {string} businessId - Business ID
 * @param {Object} settings - Settings data
 * @returns {Promise} - Updated settings
 */
export const updateBusinessSettings = async (businessId, settings) => {
  const response = await api.put(`/businesses/${businessId}/settings`, settings);
  return response.data;
};

export default {
  getAllBusinesses,
  getBusiness,
  getBusinessBySlug,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  generateQRCode,
  getBusinessSettings,
  updateBusinessSettings,
};
