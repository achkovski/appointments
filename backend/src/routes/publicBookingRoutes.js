import express from 'express';
import {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange
} from '../controllers/publicBookingController.js';

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

export default router;
