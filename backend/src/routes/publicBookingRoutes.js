import express from 'express';
import {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange,
  getEmployeesForService
} from '../controllers/publicBookingController.js';
import {
  createGuestAppointment,
  confirmAppointmentEmail,
  cancelAppointmentByClient
} from '../controllers/appointmentController.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * PUBLIC BOOKING ROUTES
 * No authentication required - accessible to all clients
 */

/**
 * @route   GET /api/public/business/:slug
 * @desc    Get business information and services by slug
 * @access  Public
 */
router.get('/business/:slug', getBusinessBySlug);

/**
 * @route   POST /api/public/available-slots
 * @desc    Get available time slots for a specific date and service
 * @access  Public
 * @body    { businessSlug, serviceId, date }
 */
router.post('/available-slots', getAvailableSlots);

/**
 * @route   POST /api/public/available-slots-range
 * @desc    Get available time slots for a date range
 * @access  Public
 * @body    { businessSlug, serviceId, startDate, endDate }
 */
router.post('/available-slots-range', getAvailableSlotsRange);

/**
 * @route   POST /api/public/book
 * @desc    Create a new appointment (guest booking)
 * @access  Public
 */
router.post('/book', bookingLimiter, createGuestAppointment);

/**
 * @route   POST /api/public/confirm-appointment
 * @desc    Confirm appointment via email token
 * @access  Public
 */
router.post('/confirm-appointment', confirmAppointmentEmail);

/**
 * @route   POST /api/public/cancel-appointment
 * @desc    Cancel appointment by client (respects cancellation notice period)
 * @access  Public
 * @body    { appointmentId, email, cancellationReason }
 */
router.post('/cancel-appointment', cancelAppointmentByClient);

/**
 * @route   GET /api/public/service/:serviceId/employees
 * @desc    Get employees assigned to a service (for booking selection)
 * @access  Public
 */
router.get('/service/:serviceId/employees', getEmployeesForService);

export default router;
