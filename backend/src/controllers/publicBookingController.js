import { calculateAvailableSlots, calculateAvailableSlotsForRange } from '../services/slotCalculator.js';
import db from '../config/database.js';
import { businesses, services, employees, employeeServices } from '../config/schema.js';
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
      city: business[0].city,
      country: business[0].country,
      phone: business[0].phone,
      email: business[0].email,
      website: business[0].website,
      businessType: business[0].businessType,
      qrCodeUrl: business[0].qrCodeUrl,
      capacityMode: business[0].capacityMode,
      timezone: business[0].timezone || 'Europe/Skopje',
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
 * Body: { businessSlug, serviceId, date, employeeId (optional) }
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { businessSlug, serviceId, date, employeeId } = req.body;

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

    // Calculate available slots (allowPastSlots=false for public bookings)
    const options = employeeId ? { employeeId } : {};
    const slotsData = await calculateAvailableSlots(businessId, serviceId, date, null, false, options);

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
 * Body: { businessSlug, serviceId, startDate, endDate, employeeId (optional) }
 */
export const getAvailableSlotsRange = async (req, res) => {
  try {
    const { businessSlug, serviceId, startDate, endDate, employeeId } = req.body;

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

    // Calculate available slots for range (allowPastSlots=false for public bookings)
    const options = employeeId ? { employeeId } : {};
    const slotsData = await calculateAvailableSlotsForRange(businessId, serviceId, startDate, endDate, false, options);

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

/**
 * Get employees for a specific service (public endpoint)
 * GET /api/public/service/:serviceId/employees
 * Returns only active employees assigned to the service
 */
export const getEmployeesForService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Get service
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get business to check if employee booking is enabled
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, service.businessId),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Check if employee booking is enabled
    const settings = business.settings || {};
    if (!settings.allowEmployeeBooking) {
      return res.json({
        success: true,
        data: {
          employeeBookingEnabled: false,
          employees: []
        }
      });
    }

    // Get active employees assigned to this service
    const assignments = await db.query.employeeServices.findMany({
      where: eq(employeeServices.serviceId, serviceId),
      with: {
        employee: true,
      },
    });

    // Filter only active employees and format response
    const activeEmployees = assignments
      .filter(a => a.employee.isActive)
      .map(a => ({
        id: a.employee.id,
        name: a.employee.name,
      }));

    res.json({
      success: true,
      data: {
        employeeBookingEnabled: true,
        employees: activeEmployees
      }
    });

  } catch (error) {
    console.error('Get employees for service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getBusinessBySlug,
  getAvailableSlots,
  getAvailableSlotsRange,
  getEmployeesForService
};
