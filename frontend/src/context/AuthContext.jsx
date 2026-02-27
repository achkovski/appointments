import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
  getCurrentUser,
} from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state — verify cookie is still valid via /auth/me
  useEffect(() => {
    const initAuth = async () => {
      const cachedUser = getCurrentUser();
      if (!cachedUser) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch {
        // Cookie expired or invalid — clear stale localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('businessId');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    try {
      const response = await loginService(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      // Re-throw error to be handled by component
      throw error;
    }
  };

  /**
   * Register new user
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    try {
      const response = await registerService(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      // Re-throw error to be handled by component
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await logoutService();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Still clear state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Update user data in context
   * @param {Object} userData - Updated user data
   */
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // non-sensitive, used for instant startup
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
