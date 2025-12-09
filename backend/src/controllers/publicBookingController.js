import { calculateAvailableSlots, calculateAvailableSlotsForRange } from '../services/slotCalculator.js';
import db from '../config/database.js';
import { businesses, services } from '../config/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * PUBLIC BOOKING CONTROLLER
 * Handles public-facing booking endpoints (no authentication required)
 * Allows clients to view available slots and business information
 */

/**
 * Get business information by slug (public endpoint)
 * GET /api/public/business/:slug
 */
export const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get business with active services
    const business = await db.select().from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Get all active services for this business
    const activeServices = await db.select().from(services)
      .where(and(
        eq(services.businessId, business[0].id),
        eq(services.isActive, true)
      ))
      .orderBy(services.displayOrder, services.name);

    // Remove sensitive information
    const publicBusinessData = {
      id: business[0].id,
      businessName: business[0].businessName,
      slug: business[0].slug,
      description: business[0].description,
      address: business[0].address,
      phone: business[0].phone,
      email: business[0].email,
      website: business[0].website,
      businessType: business[0].businessType,
      qrCodeUrl: business[0].qrCodeUrl,
      capacityMode: business[0].capacityMode,
      services: activeServices.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: s.price
      }))
    };

    res.json({
      success: true,
      data: publicBusinessData
    });

  } catch (error) {
    console.error('Get business by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve business information',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get available slots for a specific date and service
 * POST /api/public/available-slots
 * Body: { businessSlug, serviceId, date }
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { businessSlug, serviceId, date } = req.body;

    // Validate required fields
    if (!businessSlug) {
      return res.status(400).json({
        success: false,
        message: 'businessSlug is required'
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date is required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Get business by slug
    const business = await db.select().from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessId = business[0].id;

    // Verify service belongs to this business
    const service = await db.select().from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.businessId, businessId)
      ))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({
        success: false,
        message: 'Service not found for this business'
      });
    }

    // Calculate available slots
    const slotsData = await calculateAvailableSlots(businessId, serviceId, date);

    res.json({
      success: true,
      data: slotsData
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get available slots for a date range
 * POST /api/public/available-slots-range
 * Body: { businessSlug, serviceId, startDate, endDate }
 */
export const getAvailableSlotsRange = async (req, res) => {
  try {
    const { businessSlug, serviceId, startDate, endDate } = req.body;

    // Validate required fields
    if (!businessSlug) {
      return res.status(400).json({
        success: false,
        message: 'businessSlug is required'
      });
    }

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate is required'
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate is required'
      });
    }

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before or equal to endDate'
      });
    }

    // Get business by slug
    const business = await db.select().from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessId = business[0].id;

    // Verify service belongs to this business
    const service = await db.select().from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.businessId, businessId)
      ))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({
        success: false,
        message: 'Service not found for this business'
      });
    }

    // Calculate available slots for range
    const slotsData = await calculateAvailableSlotsForRange(businessId, serviceId, startDate, endDate);

    res.json({
      success: true,
      data: slotsData,
      totalDays: slotsData.length
    });

  } catch (error) {
    console.error('Get available slots range error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange
};
