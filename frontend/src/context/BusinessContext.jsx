import { createContext, useContext, useState, useEffect } from 'react';
import { getBusiness, updateBusiness as updateBusinessService } from '../services/businessService';

const BusinessContext = createContext(null);

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get business ID from localStorage or user data
  const getBusinessId = () => {
    const businessId = localStorage.getItem('businessId');
    if (businessId) return businessId;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.businessId || null;
    }

    return null;
  };

  /**
   * Fetch business data
   */
  const fetchBusiness = async () => {
    const businessId = getBusinessId();

    if (!businessId) {
      setLoading(false);
      setError(null); // No error - user just doesn't have a business yet
      setBusiness(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getBusiness(businessId);
      setBusiness(response.business || response);
      localStorage.setItem('businessId', businessId);
    } catch (err) {
      console.error('Error fetching business:', err);
      setError(err.response?.data?.message || 'Failed to fetch business data');
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  // Load business data on mount only if a businessId exists
  useEffect(() => {
    const businessId = getBusinessId();
    if (businessId) {
      fetchBusiness();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Update business data
   * @param {Object} businessData - Updated business data
   */
  const updateBusiness = async (businessData) => {
    if (!business?.id) {
      throw new Error('No business loaded');
    }

    try {
      const response = await updateBusinessService(business.id, businessData);
      setBusiness(response.business || response);
      return response;
    } catch (error) {
      console.error('Error updating business:', error);
      throw error;
    }
  };

  /**
   * Refresh business data from server
   */
  const refreshBusiness = async () => {
    await fetchBusiness();
  };

  /**
   * Set business ID and fetch data
   * @param {string} businessId - Business ID
   */
  const setBusinessId = async (businessId) => {
    localStorage.setItem('businessId', businessId);
    await fetchBusiness();
  };

  /**
   * Clear business data
   */
  const clearBusiness = () => {
    setBusiness(null);
    localStorage.removeItem('businessId');
  };

  const value = {
    business,
    loading,
    error,
    fetchBusiness,
    updateBusiness,
    refreshBusiness,
    setBusinessId,
    clearBusiness,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export default BusinessContext;
