import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly cookie on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Don't redirect on auth endpoints — let the component handle the error
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
                             requestUrl.includes('/auth/register') ||
                             requestUrl.includes('/auth/verify-email') ||
                             requestUrl.includes('/auth/me');
      if (!isAuthEndpoint) {
        localStorage.removeItem('user');
        localStorage.removeItem('businessId');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
