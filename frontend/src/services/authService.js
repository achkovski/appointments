import api from './api';

/**
 * Authentication API functions
 */

/**
 * Register a new business user
 * @param {Object} userData - User registration data (email, password, firstName, lastName, phone)
 * @returns {Promise} - Registration response with token
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);

  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Login response with token
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });

  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Logout user
 * @returns {Promise} - Logout confirmation
 */
export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    // Clear localStorage regardless of API response
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('businessId');
  }
};

/**
 * Refresh JWT token
 * @returns {Promise} - New token
 */
export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');

  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }

  return response.data;
};

/**
 * Verify email address
 * @param {string} token - Email verification token
 * @returns {Promise} - Verification confirmation
 */
export const verifyEmail = async (token) => {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise} - Password reset email confirmation
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise} - Password reset confirmation
 */
export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

/**
 * Get current user from localStorage
 * @returns {Object|null} - Current user object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get current token from localStorage
 * @returns {string|null} - Current token or null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user has valid token
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update (firstName, lastName, email, phone)
 * @returns {Promise} - Updated user data
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);

  // Update user in localStorage
  if (response.data.user) {
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }

  return response.data;
};

/**
 * Change user password
 * @param {Object} passwordData - Object containing currentPassword and newPassword
 * @returns {Promise} - Password change confirmation
 */
export const changePassword = async (passwordData) => {
  const response = await api.post('/auth/change-password', passwordData);
  return response.data;
};

export default {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  getToken,
  isAuthenticated,
  updateUser,
  changePassword,
};
