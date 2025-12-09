import express from 'express';
import {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange
} from '../controllers/publicBookingController.js';
import {
  createGuestAppointment,
  confirmAppointmentEmail
} from '../controllers/appointmentController.js';

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
router.post('/book', createGuestAppointment);

/**
 * @route   POST /api/public/confirm-appointment
 * @desc    Confirm appointment via email token
 * @access  Public
 */
router.post('/confirm-appointment', confirmAppointmentEmail);

export default router;
