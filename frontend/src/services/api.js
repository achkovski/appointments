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
      // Cookie is gone or expired — clear local user data and redirect
      localStorage.removeItem('user');
      localStorage.removeItem('businessId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
