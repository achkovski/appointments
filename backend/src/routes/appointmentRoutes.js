import express from 'express';
import {
  getBusinessAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment
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
 * @route   GET /api/appointments/:appointmentId
 * @desc    Get single appointment details
 * @access  Private (Business Owner)
 */
router.get('/appointments/:appointmentId', protect, getAppointmentById);

/**
 * @route   PUT /api/appointments/:appointmentId/status
 * @desc    Update appointment status (confirm, cancel, etc.)
 * @access  Private (Business Owner)
 */
router.put('/appointments/:appointmentId/status', protect, updateAppointmentStatus);

/**
 * @route   PUT /api/appointments/:appointmentId/notes
 * @desc    Update appointment notes
 * @access  Private (Business Owner)
 */
router.put('/appointments/:appointmentId/notes', protect, updateAppointmentNotes);

/**
 * @route   PUT /api/appointments/:appointmentId/reschedule
 * @desc    Reschedule appointment
 * @access  Private (Business Owner)
 */
router.put('/appointments/:appointmentId/reschedule', protect, rescheduleAppointment);

export default router;
