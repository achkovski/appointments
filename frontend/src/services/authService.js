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

  // Token is set as httpOnly cookie by the server.
  // Store user object locally for instant startup rendering (non-sensitive).
  if (response.data.user) {
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

  // Token is set as httpOnly cookie by the server.
  // Store user object locally for instant startup rendering (non-sensitive).
  if (response.data.user) {
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
    // Server clears the httpOnly cookie
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('businessId');
  }
};

/**
 * Refresh JWT token
 * @returns {Promise} - New token
 */
export const refreshToken = async () => {
  // Cookie rotation handled server-side if implemented
  const response = await api.post('/auth/refresh');
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
 * Check if user is authenticated (cookie is httpOnly so we check the cached user object)
 * @returns {boolean} - True if a user session is likely active
 */
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update (firstName, lastName, email, phone)
 * @returns {Promise} - Updated user data
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);

  // Keep cached user object up to date for fast startup
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
  isAuthenticated,
  updateUser,
  changePassword,
};
