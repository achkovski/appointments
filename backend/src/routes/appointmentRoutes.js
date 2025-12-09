import express from 'express';
import {
  getBusinessAppointments,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * APPOINTMENT MANAGEMENT ROUTES
 * Protected routes for business owners to manage appointments
 */

/**
 * @route   GET /api/appointments/business/:businessId
 * @desc    Get all appointments for a business
 * @access  Private (Business Owner)
 * @query   ?status=PENDING&date=YYYY-MM-DD&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/appointments/business/:businessId', protect, getBusinessAppointments);

/**
 * @route   PUT /api/appointments/:appointmentId/status
 * @desc    Update appointment status (confirm, cancel, etc.)
 * @access  Private (Business Owner)
 */
router.put('/appointments/:appointmentId/status', protect, updateAppointmentStatus);

export default router;
