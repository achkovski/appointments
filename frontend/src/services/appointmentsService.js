import api from './api';

const appointmentsService = {
  // Get all appointments for a business
  getAppointments: async (businessId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/appointments/business/${businessId}?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single appointment
  getAppointment: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new appointment (manual)
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Confirm appointment
  confirmAppointment: async (appointmentId) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/confirm`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`, {
        data: { reason },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (businessId) => {
    try {
      const response = await api.get(`/appointments/upcoming?businessId=${businessId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get past appointments
  getPastAppointments: async (businessId) => {
    try {
      const response = await api.get(`/appointments/past?businessId=${businessId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default appointmentsService;
