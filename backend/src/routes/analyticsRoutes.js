import express from 'express';
import {
  getAnalyticsOverview,
  getBookingTrends,
  getPopularDays,
  getPopularTimeSlots,
  getServicePerformance,
  exportAnalytics
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * ANALYTICS ROUTES
 * Protected routes for business owners to view analytics
 */

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview (totals, rates, etc.)
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics/overview', protect, getAnalyticsOverview);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get booking trends over time
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=day|week|month
 */
router.get('/analytics/trends', protect, getBookingTrends);

/**
 * @route   GET /api/analytics/popular-days
 * @desc    Get most popular days of the week
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics/popular-days', protect, getPopularDays);

/**
 * @route   GET /api/analytics/popular-times
 * @desc    Get most popular time slots
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics/popular-times', protect, getPopularTimeSlots);

/**
 * @route   GET /api/analytics/services
 * @desc    Get service performance analytics
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/analytics/services', protect, getServicePerformance);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data as CSV
 * @access  Private (Business Owner)
 * @query   ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=appointments
 */
router.get('/analytics/export', protect, exportAnalytics);

export default router;
