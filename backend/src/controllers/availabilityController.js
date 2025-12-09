import db from '../config/database.js';
import { availability, breaks, specialDates, businesses } from '../config/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * AVAILABILITY CONTROLLER
 * Handles working hours, breaks, and special dates management for businesses
 */

// ============================
// AVAILABILITY (Working Hours)
// ============================

/**
 * Get all availability rules for a business
 * GET /api/businesses/:businessId/availability
 */
export const getAvailability = async (req, res) => {
  try {
    const { businessId } = req.params;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Get all availability rules with their breaks
    const availabilityRules = await db.select().from(availability)
      .where(eq(availability.businessId, businessId))
      .orderBy(availability.dayOfWeek);

    // Get breaks for each availability rule
    const rulesWithBreaks = await Promise.all(
      availabilityRules.map(async (rule) => {
        const ruleBreaks = await db.select().from(breaks)
          .where(eq(breaks.availabilityId, rule.id))
          .orderBy(breaks.breakStart);

        return {
          ...rule,
          breaks: ruleBreaks
        };
      })
    );

    res.json({
      success: true,
      data: rulesWithBreaks
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      message: 'Failed to retrieve availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new availability rule for a business
 * POST /api/businesses/:businessId/availability
 * Body: { dayOfWeek, startTime, endTime, isAvailable, capacityOverride }
 */
export const createAvailability = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable, capacityOverride } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Validate dayOfWeek (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' });
    }

    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM or HH:MM:SS' });
    }

    // Validate startTime < endTime
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    // Create availability rule
    const newRule = {
      id: randomUUID(),
      businessId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      capacityOverride: capacityOverride || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(availability).values(newRule);

    res.status(201).json({
      success: true,
      message: 'Availability rule created successfully',
      data: newRule
    });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({
      message: 'Failed to create availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an availability rule
 * PUT /api/businesses/:businessId/availability/:availabilityId
 * Body: { dayOfWeek, startTime, endTime, isAvailable, capacityOverride }
 */
export const updateAvailability = async (req, res) => {
  try {
    const { businessId, availabilityId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable, capacityOverride } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists and belongs to this business
    const existingRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!existingRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Build update object
    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (dayOfWeek !== undefined) {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' });
      }
      updates.dayOfWeek = dayOfWeek;
    }

    if (startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(startTime)) {
        return res.status(400).json({ message: 'Invalid startTime format. Use HH:MM or HH:MM:SS' });
      }
      updates.startTime = startTime;
    }

    if (endTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(endTime)) {
        return res.status(400).json({ message: 'Invalid endTime format. Use HH:MM or HH:MM:SS' });
      }
      updates.endTime = endTime;
    }

    // Validate startTime < endTime
    const finalStartTime = startTime !== undefined ? startTime : existingRule[0].startTime;
    const finalEndTime = endTime !== undefined ? endTime : existingRule[0].endTime;
    if (finalStartTime >= finalEndTime) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    if (isAvailable !== undefined) {
      updates.isAvailable = isAvailable;
    }

    if (capacityOverride !== undefined) {
      updates.capacityOverride = capacityOverride;
    }

    await db.update(availability)
      .set(updates)
      .where(eq(availability.id, availabilityId));

    const updatedRule = await db.select().from(availability)
      .where(eq(availability.id, availabilityId))
      .limit(1);

    res.json({
      success: true,
      message: 'Availability rule updated successfully',
      data: updatedRule[0]
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      message: 'Failed to update availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an availability rule
 * DELETE /api/businesses/:businessId/availability/:availabilityId
 */
export const deleteAvailability = async (req, res) => {
  try {
    const { businessId, availabilityId } = req.params;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists and belongs to this business
    const existingRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!existingRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Delete the rule (breaks will cascade delete automatically)
    await db.delete(availability).where(eq(availability.id, availabilityId));

    res.json({
      success: true,
      message: 'Availability rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({
      message: 'Failed to delete availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// BREAKS
// ============================

/**
 * Get all breaks for an availability rule
 * GET /api/businesses/:businessId/availability/:availabilityId/breaks
 */
export const getBreaks = async (req, res) => {
  try {
    const { businessId, availabilityId } = req.params;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!availabilityRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Get all breaks
    const allBreaks = await db.select().from(breaks)
      .where(eq(breaks.availabilityId, availabilityId))
      .orderBy(breaks.breakStart);

    res.json({
      success: true,
      data: allBreaks
    });
  } catch (error) {
    console.error('Get breaks error:', error);
    res.status(500).json({
      message: 'Failed to retrieve breaks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a break for an availability rule
 * POST /api/businesses/:businessId/availability/:availabilityId/breaks
 * Body: { breakStart, breakEnd }
 */
export const createBreak = async (req, res) => {
  try {
    const { businessId, availabilityId } = req.params;
    const { breakStart, breakEnd } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!availabilityRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(breakStart) || !timeRegex.test(breakEnd)) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM or HH:MM:SS' });
    }

    // Validate breakStart < breakEnd
    if (breakStart >= breakEnd) {
      return res.status(400).json({ message: 'breakStart must be before breakEnd' });
    }

    // Validate break is within availability hours
    const { startTime, endTime } = availabilityRule[0];
    if (breakStart < startTime || breakEnd > endTime) {
      return res.status(400).json({
        message: `Break must be within availability hours (${startTime} - ${endTime})`
      });
    }

    // Create break
    const newBreak = {
      id: randomUUID(),
      availabilityId,
      breakStart,
      breakEnd,
      createdAt: new Date().toISOString()
    };

    await db.insert(breaks).values(newBreak);

    res.status(201).json({
      success: true,
      message: 'Break created successfully',
      data: newBreak
    });
  } catch (error) {
    console.error('Create break error:', error);
    res.status(500).json({
      message: 'Failed to create break',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a break
 * PUT /api/businesses/:businessId/availability/:availabilityId/breaks/:breakId
 * Body: { breakStart, breakEnd }
 */
export const updateBreak = async (req, res) => {
  try {
    const { businessId, availabilityId, breakId } = req.params;
    const { breakStart, breakEnd } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!availabilityRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Verify break exists
    const existingBreak = await db.select().from(breaks)
      .where(and(
        eq(breaks.id, breakId),
        eq(breaks.availabilityId, availabilityId)
      ))
      .limit(1);

    if (!existingBreak.length) {
      return res.status(404).json({ message: 'Break not found' });
    }

    // Build update object
    const updates = {};

    if (breakStart !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(breakStart)) {
        return res.status(400).json({ message: 'Invalid breakStart format. Use HH:MM or HH:MM:SS' });
      }
      updates.breakStart = breakStart;
    }

    if (breakEnd !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(breakEnd)) {
        return res.status(400).json({ message: 'Invalid breakEnd format. Use HH:MM or HH:MM:SS' });
      }
      updates.breakEnd = breakEnd;
    }

    // Validate breakStart < breakEnd
    const finalBreakStart = breakStart !== undefined ? breakStart : existingBreak[0].breakStart;
    const finalBreakEnd = breakEnd !== undefined ? breakEnd : existingBreak[0].breakEnd;
    if (finalBreakStart >= finalBreakEnd) {
      return res.status(400).json({ message: 'breakStart must be before breakEnd' });
    }

    // Validate break is within availability hours
    const { startTime, endTime } = availabilityRule[0];
    if (finalBreakStart < startTime || finalBreakEnd > endTime) {
      return res.status(400).json({
        message: `Break must be within availability hours (${startTime} - ${endTime})`
      });
    }

    await db.update(breaks)
      .set(updates)
      .where(eq(breaks.id, breakId));

    const updatedBreak = await db.select().from(breaks)
      .where(eq(breaks.id, breakId))
      .limit(1);

    res.json({
      success: true,
      message: 'Break updated successfully',
      data: updatedBreak[0]
    });
  } catch (error) {
    console.error('Update break error:', error);
    res.status(500).json({
      message: 'Failed to update break',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a break
 * DELETE /api/businesses/:businessId/availability/:availabilityId/breaks/:breakId
 */
export const deleteBreak = async (req, res) => {
  try {
    const { businessId, availabilityId, breakId } = req.params;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(availability)
      .where(and(
        eq(availability.id, availabilityId),
        eq(availability.businessId, businessId)
      ))
      .limit(1);

    if (!availabilityRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Verify break exists
    const existingBreak = await db.select().from(breaks)
      .where(and(
        eq(breaks.id, breakId),
        eq(breaks.availabilityId, availabilityId)
      ))
      .limit(1);

    if (!existingBreak.length) {
      return res.status(404).json({ message: 'Break not found' });
    }

    // Delete the break
    await db.delete(breaks).where(eq(breaks.id, breakId));

    res.json({
      success: true,
      message: 'Break deleted successfully'
    });
  } catch (error) {
    console.error('Delete break error:', error);
    res.status(500).json({
      message: 'Failed to delete break',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// SPECIAL DATES
// ============================

/**
 * Get all special dates for a business
 * GET /api/businesses/:businessId/special-dates
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional date range)
 */
export const getSpecialDates = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Build query with optional date range
    let query = db.select().from(specialDates).where(eq(specialDates.businessId, businessId));

    if (from && to) {
      query = db.select().from(specialDates)
        .where(and(
          eq(specialDates.businessId, businessId),
          gte(specialDates.date, from),
          lte(specialDates.date, to)
        ));
    } else if (from) {
      query = db.select().from(specialDates)
        .where(and(
          eq(specialDates.businessId, businessId),
          gte(specialDates.date, from)
        ));
    } else if (to) {
      query = db.select().from(specialDates)
        .where(and(
          eq(specialDates.businessId, businessId),
          lte(specialDates.date, to)
        ));
    }

    const dates = await query.orderBy(specialDates.date);

    res.json({
      success: true,
      data: dates
    });
  } catch (error) {
    console.error('Get special dates error:', error);
    res.status(500).json({
      message: 'Failed to retrieve special dates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a special date
 * POST /api/businesses/:businessId/special-dates
 * Body: { date, isAvailable, startTime, endTime, capacityOverride, reason }
 */
export const createSpecialDate = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, isAvailable, startTime, endTime, capacityOverride, reason } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate times if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({ message: 'Invalid startTime format. Use HH:MM or HH:MM:SS' });
      }

      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({ message: 'Invalid endTime format. Use HH:MM or HH:MM:SS' });
      }

      // If both times provided, validate startTime < endTime
      if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({ message: 'startTime must be before endTime' });
      }

      // If isAvailable is true and custom hours are set, both times must be provided
      if (isAvailable && (startTime || endTime) && !(startTime && endTime)) {
        return res.status(400).json({
          message: 'Both startTime and endTime must be provided for custom hours'
        });
      }
    }

    // Create special date
    const newSpecialDate = {
      id: randomUUID(),
      businessId,
      date,
      isAvailable: isAvailable !== undefined ? isAvailable : false,
      startTime: startTime || null,
      endTime: endTime || null,
      capacityOverride: capacityOverride || null,
      reason: reason || null,
      createdAt: new Date().toISOString()
    };

    await db.insert(specialDates).values(newSpecialDate);

    res.status(201).json({
      success: true,
      message: 'Special date created successfully',
      data: newSpecialDate
    });
  } catch (error) {
    console.error('Create special date error:', error);
    res.status(500).json({
      message: 'Failed to create special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a special date
 * PUT /api/businesses/:businessId/special-dates/:specialDateId
 * Body: { date, isAvailable, startTime, endTime, capacityOverride, reason }
 */
export const updateSpecialDate = async (req, res) => {
  try {
    const { businessId, specialDateId } = req.params;
    const { date, isAvailable, startTime, endTime, capacityOverride, reason } = req.body;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify special date exists
    const existingSpecialDate = await db.select().from(specialDates)
      .where(and(
        eq(specialDates.id, specialDateId),
        eq(specialDates.businessId, businessId)
      ))
      .limit(1);

    if (!existingSpecialDate.length) {
      return res.status(404).json({ message: 'Special date not found' });
    }

    // Build update object
    const updates = {};

    if (date !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
      }
      updates.date = date;
    }

    if (isAvailable !== undefined) {
      updates.isAvailable = isAvailable;
    }

    if (startTime !== undefined) {
      if (startTime === null) {
        updates.startTime = null;
      } else {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(startTime)) {
          return res.status(400).json({ message: 'Invalid startTime format. Use HH:MM or HH:MM:SS' });
        }
        updates.startTime = startTime;
      }
    }

    if (endTime !== undefined) {
      if (endTime === null) {
        updates.endTime = null;
      } else {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(endTime)) {
          return res.status(400).json({ message: 'Invalid endTime format. Use HH:MM or HH:MM:SS' });
        }
        updates.endTime = endTime;
      }
    }

    // Validate startTime < endTime if both are set
    const finalStartTime = startTime !== undefined ? startTime : existingSpecialDate[0].startTime;
    const finalEndTime = endTime !== undefined ? endTime : existingSpecialDate[0].endTime;
    if (finalStartTime && finalEndTime && finalStartTime >= finalEndTime) {
      return res.status(400).json({ message: 'startTime must be before endTime' });
    }

    if (capacityOverride !== undefined) {
      updates.capacityOverride = capacityOverride;
    }

    if (reason !== undefined) {
      updates.reason = reason;
    }

    await db.update(specialDates)
      .set(updates)
      .where(eq(specialDates.id, specialDateId));

    const updatedSpecialDate = await db.select().from(specialDates)
      .where(eq(specialDates.id, specialDateId))
      .limit(1);

    res.json({
      success: true,
      message: 'Special date updated successfully',
      data: updatedSpecialDate[0]
    });
  } catch (error) {
    console.error('Update special date error:', error);
    res.status(500).json({
      message: 'Failed to update special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete a special date
 * DELETE /api/businesses/:businessId/special-dates/:specialDateId
 */
export const deleteSpecialDate = async (req, res) => {
  try {
    const { businessId, specialDateId } = req.params;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!business.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({ message: 'Access denied. You do not own this business.' });
    }

    // Verify special date exists
    const existingSpecialDate = await db.select().from(specialDates)
      .where(and(
        eq(specialDates.id, specialDateId),
        eq(specialDates.businessId, businessId)
      ))
      .limit(1);

    if (!existingSpecialDate.length) {
      return res.status(404).json({ message: 'Special date not found' });
    }

    // Delete the special date
    await db.delete(specialDates).where(eq(specialDates.id, specialDateId));

    res.json({
      success: true,
      message: 'Special date deleted successfully'
    });
  } catch (error) {
    console.error('Delete special date error:', error);
    res.status(500).json({
      message: 'Failed to delete special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
