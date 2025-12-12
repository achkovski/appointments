import api from './api';

/**
 * Service API functions for managing business services
 */

/**
 * Get all services for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of services
 */
export const getServices = async (businessId) => {
  const response = await api.get(`/services/business/${businessId}`);
  return response.data;
};

/**
 * Get only active services for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of active services
 */
export const getActiveServices = async (businessId) => {
  const response = await api.get(`/services/business/${businessId}/active`);
  return response.data;
};

/**
 * Get a single service by ID
 * @param {string} serviceId - Service ID
 * @returns {Promise} - Service details
 */
export const getService = async (serviceId) => {
  const response = await api.get(`/services/${serviceId}`);
  return response.data;
};

/**
 * Create a new service
 * @param {string} businessId - Business ID
 * @param {Object} serviceData - Service data
 * @returns {Promise} - Created service
 */
export const createService = async (businessId, serviceData) => {
  const response = await api.post('/services', {
    businessId,
    ...serviceData
  });
  return response.data;
};

/**
 * Update an existing service
 * @param {string} serviceId - Service ID
 * @param {Object} serviceData - Updated service data
 * @returns {Promise} - Updated service
 */
export const updateService = async (serviceId, serviceData) => {
  const response = await api.put(`/services/${serviceId}`, serviceData);
  return response.data;
};

/**
 * Delete a service
 * @param {string} serviceId - Service ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteService = async (serviceId) => {
  const response = await api.delete(`/services/${serviceId}`);
  return response.data;
};

/**
 * Toggle service active/inactive status
 * @param {string} serviceId - Service ID
 * @returns {Promise} - Updated service
 */
export const toggleServiceStatus = async (serviceId) => {
  const response = await api.put(`/services/${serviceId}/toggle`);
  return response.data;
};

/**
 * Reorder services
 * @param {Array} services - Array of service objects with id and displayOrder
 * @returns {Promise} - Updated services
 */
export const reorderServices = async (services) => {
  const response = await api.put('/services/reorder', { services });
  return response.data;
};

export default {
  getServices,
  getActiveServices,
  getService,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  reorderServices,
};
