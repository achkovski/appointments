import api from './api';

/**
 * Employee API functions for managing business employees
 */

/**
 * Get all employees for a business
 * @param {string} businessId - Business ID
 * @returns {Promise} - List of employees
 */
export const getEmployees = async (businessId, includeInactive = true) => {
  const response = await api.get(`/employees/business/${businessId}?includeInactive=${includeInactive}`);
  return response.data;
};

/**
 * Get a single employee by ID
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - Employee details
 */
export const getEmployee = async (employeeId) => {
  const response = await api.get(`/employees/${employeeId}`);
  return response.data;
};

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data including businessId
 * @returns {Promise} - Created employee
 */
export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

/**
 * Update an existing employee
 * @param {string} employeeId - Employee ID
 * @param {Object} employeeData - Updated employee data
 * @returns {Promise} - Updated employee
 */
export const updateEmployee = async (employeeId, employeeData) => {
  const response = await api.put(`/employees/${employeeId}`, employeeData);
  return response.data;
};

/**
 * Delete an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - Deletion confirmation
 */
export const deleteEmployee = async (employeeId) => {
  const response = await api.delete(`/employees/${employeeId}`);
  return response.data;
};

/**
 * Toggle employee active/inactive status
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - Updated employee
 */
export const toggleEmployeeStatus = async (employeeId) => {
  const response = await api.put(`/employees/${employeeId}/toggle`);
  return response.data;
};

/**
 * Assign services to an employee
 * @param {string} employeeId - Employee ID
 * @param {Array<string>} serviceIds - Array of service IDs to assign
 * @returns {Promise} - Assignment result
 */
export const assignServices = async (employeeId, serviceIds) => {
  const response = await api.post(`/employees/${employeeId}/services`, { serviceIds });
  return response.data;
};

/**
 * Remove a service from an employee
 * @param {string} employeeId - Employee ID
 * @param {string} serviceId - Service ID to remove
 * @returns {Promise} - Removal result
 */
export const removeService = async (employeeId, serviceId) => {
  const response = await api.delete(`/employees/${employeeId}/services/${serviceId}`);
  return response.data;
};

/**
 * Get employees for a specific service
 * @param {string} serviceId - Service ID
 * @returns {Promise} - List of employees assigned to the service
 */
export const getEmployeesByService = async (serviceId) => {
  const response = await api.get(`/employees/service/${serviceId}`);
  return response.data;
};

/**
 * Get employee availability
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - Employee availability data
 */
export const getEmployeeAvailability = async (employeeId) => {
  const response = await api.get(`/employees/${employeeId}/availability`);
  return response.data;
};

/**
 * Create employee availability entry
 * @param {string} employeeId - Employee ID
 * @param {Object} availabilityData - Availability data
 * @returns {Promise} - Created availability
 */
export const createEmployeeAvailability = async (employeeId, availabilityData) => {
  const response = await api.post(`/employees/${employeeId}/availability`, availabilityData);
  return response.data;
};

/**
 * Update employee availability
 * @param {string} employeeId - Employee ID
 * @param {string} availabilityId - Availability ID
 * @param {Object} availabilityData - Updated availability data
 * @returns {Promise} - Updated availability
 */
export const updateEmployeeAvailability = async (employeeId, availabilityId, availabilityData) => {
  const response = await api.put(`/employees/${employeeId}/availability/${availabilityId}`, availabilityData);
  return response.data;
};

/**
 * Delete employee availability
 * @param {string} employeeId - Employee ID
 * @param {string} availabilityId - Availability ID
 * @returns {Promise} - Deletion result
 */
export const deleteEmployeeAvailability = async (employeeId, availabilityId) => {
  const response = await api.delete(`/employees/${employeeId}/availability/${availabilityId}`);
  return response.data;
};

/**
 * Copy availability from business to employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - Copy result
 */
export const copyBusinessAvailability = async (employeeId) => {
  const response = await api.post(`/employees/${employeeId}/availability/copy-from-business`);
  return response.data;
};

/**
 * Create employee break
 * @param {string} employeeId - Employee ID
 * @param {string} availabilityId - Availability ID
 * @param {Object} breakData - Break data
 * @returns {Promise} - Created break
 */
export const createEmployeeBreak = async (employeeId, availabilityId, breakData) => {
  const response = await api.post(`/employees/${employeeId}/availability/${availabilityId}/breaks`, breakData);
  return response.data;
};

/**
 * Delete employee break
 * @param {string} employeeId - Employee ID
 * @param {string} availabilityId - Availability ID
 * @param {string} breakId - Break ID
 * @returns {Promise} - Deletion result
 */
export const deleteEmployeeBreak = async (employeeId, availabilityId, breakId) => {
  const response = await api.delete(`/employees/${employeeId}/availability/${availabilityId}/breaks/${breakId}`);
  return response.data;
};

/**
 * Get employee special dates
 * @param {string} employeeId - Employee ID
 * @returns {Promise} - List of special dates
 */
export const getEmployeeSpecialDates = async (employeeId) => {
  const response = await api.get(`/employees/${employeeId}/special-dates`);
  return response.data;
};

/**
 * Create employee special date
 * @param {string} employeeId - Employee ID
 * @param {Object} specialDateData - Special date data
 * @returns {Promise} - Created special date
 */
export const createEmployeeSpecialDate = async (employeeId, specialDateData) => {
  const response = await api.post(`/employees/${employeeId}/special-dates`, specialDateData);
  return response.data;
};

/**
 * Update employee special date
 * @param {string} employeeId - Employee ID
 * @param {string} specialDateId - Special date ID
 * @param {Object} specialDateData - Updated special date data
 * @returns {Promise} - Updated special date
 */
export const updateEmployeeSpecialDate = async (employeeId, specialDateId, specialDateData) => {
  const response = await api.put(`/employees/${employeeId}/special-dates/${specialDateId}`, specialDateData);
  return response.data;
};

/**
 * Delete employee special date
 * @param {string} employeeId - Employee ID
 * @param {string} specialDateId - Special date ID
 * @returns {Promise} - Deletion result
 */
export const deleteEmployeeSpecialDate = async (employeeId, specialDateId) => {
  const response = await api.delete(`/employees/${employeeId}/special-dates/${specialDateId}`);
  return response.data;
};

export default {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  assignServices,
  removeService,
  getEmployeesByService,
  getEmployeeAvailability,
  createEmployeeAvailability,
  updateEmployeeAvailability,
  deleteEmployeeAvailability,
  copyBusinessAvailability,
  createEmployeeBreak,
  deleteEmployeeBreak,
  getEmployeeSpecialDates,
  createEmployeeSpecialDate,
  updateEmployeeSpecialDate,
  deleteEmployeeSpecialDate,
};
