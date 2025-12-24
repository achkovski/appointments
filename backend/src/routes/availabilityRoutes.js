import express from 'express';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getBreaks,
  createBreak,
  updateBreak,
  deleteBreak,
  getSpecialDates,
  createSpecialDate,
  updateSpecialDate,
  deleteSpecialDate
} from '../controllers/availabilityController.js';
import { protect } from '../middleware/auth.js';
import {
  validateAvailability,
  validateBreak,
  validateSpecialDate
} from '../middleware/validation.js';

const router = express.Router();

/**
 * All routes require authentication
 * Only business owners can manage their availability
 */

// ============================
// AVAILABILITY (Working Hours) Routes
// ============================

/**
 * @route   GET /api/businesses/:businessId/availability
 * @desc    Get all availability rules for a business
 * @access  Private (Business Owner)
 */
router.get(
  '/businesses/:businessId/availability',
  protect,
  getAvailability
);

/**
 * @route   POST /api/businesses/:businessId/availability
 * @desc    Create a new availability rule
 * @access  Private (Business Owner)
 */
router.post(
  '/businesses/:businessId/availability',
  protect,
  validateAvailability,
  createAvailability
);

/**
 * @route   PUT /api/businesses/:businessId/availability/:availabilityId
 * @desc    Update an availability rule
 * @access  Private (Business Owner)
 */
router.put(
  '/businesses/:businessId/availability/:availabilityId',
  protect,
  validateAvailability,
  updateAvailability
);

/**
 * @route   DELETE /api/businesses/:businessId/availability/:availabilityId
 * @desc    Delete an availability rule
 * @access  Private (Business Owner)
 */
router.delete(
  '/businesses/:businessId/availability/:availabilityId',
  protect,
  deleteAvailability
);

// ============================
// BREAKS Routes
// ============================

/**
 * @route   GET /api/businesses/:businessId/availability/:availabilityId/breaks
 * @desc    Get all breaks for an availability rule
 * @access  Private (Business Owner)
 */
router.get(
  '/businesses/:businessId/availability/:availabilityId/breaks',
  protect,
  getBreaks
);

/**
 * @route   POST /api/businesses/:businessId/availability/:availabilityId/breaks
 * @desc    Create a break for an availability rule
 * @access  Private (Business Owner)
 */
router.post(
  '/businesses/:businessId/availability/:availabilityId/breaks',
  protect,
  validateBreak,
  createBreak
);

/**
 * @route   PUT /api/businesses/:businessId/availability/:availabilityId/breaks/:breakId
 * @desc    Update a break
 * @access  Private (Business Owner)
 */
router.put(
  '/businesses/:businessId/availability/:availabilityId/breaks/:breakId',
  protect,
  validateBreak,
  updateBreak
);

/**
 * @route   DELETE /api/businesses/:businessId/availability/:availabilityId/breaks/:breakId
 * @desc    Delete a break
 * @access  Private (Business Owner)
 */
router.delete(
  '/businesses/:businessId/availability/:availabilityId/breaks/:breakId',
  protect,
  deleteBreak
);

// ============================
// SPECIAL DATES Routes
// ============================

/**
 * @route   GET /api/businesses/:businessId/special-dates
 * @desc    Get all special dates for a business (with optional date range)
 * @access  Private (Business Owner)
 * @query   ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional)
 */
router.get(
  '/businesses/:businessId/special-dates',
  protect,
  getSpecialDates
);

/**
 * @route   POST /api/businesses/:businessId/special-dates
 * @desc    Create a special date
 * @access  Private (Business Owner)
 */
router.post(
  '/businesses/:businessId/special-dates',
  protect,
  validateSpecialDate,
  createSpecialDate
);

/**
 * @route   PUT /api/businesses/:businessId/special-dates/:specialDateId
 * @desc    Update a special date
 * @access  Private (Business Owner)
 */
router.put(
  '/businesses/:businessId/special-dates/:specialDateId',
  protect,
  validateSpecialDate,
  updateSpecialDate
);

/**
 * @route   DELETE /api/businesses/:businessId/special-dates/:specialDateId
 * @desc    Delete a special date
 * @access  Private (Business Owner)
 */
router.delete(
  '/businesses/:businessId/special-dates/:specialDateId',
  protect,
  deleteSpecialDate
);

export default router;
