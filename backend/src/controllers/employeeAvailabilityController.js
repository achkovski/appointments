import db from '../config/database.js';
import { employeeAvailability, employeeBreaks, employeeSpecialDates, employees, businesses, availability, breaks } from '../config/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * EMPLOYEE AVAILABILITY CONTROLLER
 * Handles working hours, breaks, and special dates management for employees
 */

// Helper function to verify employee ownership
async function verifyEmployeeOwnership(employeeId, userId) {
  const employee = await db.query.employees.findFirst({
    where: eq(employees.id, employeeId),
  });

  if (!employee) {
    return { error: 'Employee not found', status: 404 };
  }

  const business = await db.query.businesses.findFirst({
    where: and(
      eq(businesses.id, employee.businessId),
      eq(businesses.ownerId, userId)
    ),
  });

  if (!business) {
    return { error: 'Access denied. You do not own this business.', status: 403 };
  }

  return { employee, business };
}

// ============================
// EMPLOYEE AVAILABILITY (Working Hours)
// ============================

/**
 * Get all availability rules for an employee
 * GET /api/employees/:employeeId/availability
 */
export const getEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Get all availability rules with their breaks
    const availabilityRules = await db.select().from(employeeAvailability)
      .where(eq(employeeAvailability.employeeId, employeeId))
      .orderBy(employeeAvailability.dayOfWeek);

    // Get breaks for each availability rule
    const rulesWithBreaks = await Promise.all(
      availabilityRules.map(async (rule) => {
        const ruleBreaks = await db.select().from(employeeBreaks)
          .where(eq(employeeBreaks.employeeAvailabilityId, rule.id))
          .orderBy(employeeBreaks.breakStart);

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
    console.error('Get employee availability error:', error);
    res.status(500).json({
      message: 'Failed to retrieve employee availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new availability rule for an employee
 * POST /api/employees/:employeeId/availability
 * Body: { dayOfWeek, startTime, endTime, isAvailable }
 */
export const createEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
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
      employeeId,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(employeeAvailability).values(newRule);

    res.status(201).json({
      success: true,
      message: 'Employee availability rule created successfully',
      data: newRule
    });
  } catch (error) {
    console.error('Create employee availability error:', error);
    res.status(500).json({
      message: 'Failed to create employee availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an employee availability rule
 * PUT /api/employees/:employeeId/availability/:availabilityId
 * Body: { dayOfWeek, startTime, endTime, isAvailable }
 */
export const updateEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId, availabilityId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify availability rule exists and belongs to this employee
    const existingRule = await db.select().from(employeeAvailability)
      .where(and(
        eq(employeeAvailability.id, availabilityId),
        eq(employeeAvailability.employeeId, employeeId)
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

    await db.update(employeeAvailability)
      .set(updates)
      .where(eq(employeeAvailability.id, availabilityId));

    const updatedRule = await db.select().from(employeeAvailability)
      .where(eq(employeeAvailability.id, availabilityId))
      .limit(1);

    res.json({
      success: true,
      message: 'Employee availability rule updated successfully',
      data: updatedRule[0]
    });
  } catch (error) {
    console.error('Update employee availability error:', error);
    res.status(500).json({
      message: 'Failed to update employee availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an employee availability rule
 * DELETE /api/employees/:employeeId/availability/:availabilityId
 */
export const deleteEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId, availabilityId } = req.params;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify availability rule exists and belongs to this employee
    const existingRule = await db.select().from(employeeAvailability)
      .where(and(
        eq(employeeAvailability.id, availabilityId),
        eq(employeeAvailability.employeeId, employeeId)
      ))
      .limit(1);

    if (!existingRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Delete the rule (breaks will cascade delete automatically)
    await db.delete(employeeAvailability).where(eq(employeeAvailability.id, availabilityId));

    res.json({
      success: true,
      message: 'Employee availability rule deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee availability error:', error);
    res.status(500).json({
      message: 'Failed to delete employee availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Copy business availability to employee
 * POST /api/employees/:employeeId/availability/copy-from-business
 */
export const copyBusinessAvailability = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    const { employee, business } = verification;

    // Get business availability with breaks
    const businessAvailabilityRules = await db.select().from(availability)
      .where(eq(availability.businessId, business.id))
      .orderBy(availability.dayOfWeek);

    // Get breaks for each availability rule
    const businessAvailability = await Promise.all(
      businessAvailabilityRules.map(async (rule) => {
        const ruleBreaks = await db.select().from(breaks)
          .where(eq(breaks.availabilityId, rule.id));
        return {
          ...rule,
          breaks: ruleBreaks
        };
      })
    );

    // Delete existing employee availability
    await db.delete(employeeAvailability).where(eq(employeeAvailability.employeeId, employeeId));

    // Copy business availability to employee
    const now = new Date().toISOString();
    for (const rule of businessAvailability) {
      const newRuleId = randomUUID();
      await db.insert(employeeAvailability).values({
        id: newRuleId,
        employeeId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        isAvailable: rule.isAvailable,
        createdAt: now,
        updatedAt: now,
      });

      // Copy breaks
      if (rule.breaks && rule.breaks.length > 0) {
        for (const brk of rule.breaks) {
          await db.insert(employeeBreaks).values({
            id: randomUUID(),
            employeeAvailabilityId: newRuleId,
            breakStart: brk.breakStart,
            breakEnd: brk.breakEnd,
            createdAt: now,
          });
        }
      }
    }

    // Fetch the new availability
    const newAvailability = await db.select().from(employeeAvailability)
      .where(eq(employeeAvailability.employeeId, employeeId))
      .orderBy(employeeAvailability.dayOfWeek);

    res.json({
      success: true,
      message: 'Business availability copied to employee successfully',
      data: newAvailability
    });
  } catch (error) {
    console.error('Copy business availability error:', error);
    res.status(500).json({
      message: 'Failed to copy business availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// EMPLOYEE BREAKS
// ============================

/**
 * Create a break for an employee availability rule
 * POST /api/employees/:employeeId/availability/:availabilityId/breaks
 * Body: { breakStart, breakEnd }
 */
export const createEmployeeBreak = async (req, res) => {
  try {
    const { employeeId, availabilityId } = req.params;
    const { breakStart, breakEnd } = req.body;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(employeeAvailability)
      .where(and(
        eq(employeeAvailability.id, availabilityId),
        eq(employeeAvailability.employeeId, employeeId)
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
      employeeAvailabilityId: availabilityId,
      breakStart,
      breakEnd,
      createdAt: new Date().toISOString()
    };

    await db.insert(employeeBreaks).values(newBreak);

    res.status(201).json({
      success: true,
      message: 'Employee break created successfully',
      data: newBreak
    });
  } catch (error) {
    console.error('Create employee break error:', error);
    res.status(500).json({
      message: 'Failed to create employee break',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an employee break
 * DELETE /api/employees/:employeeId/availability/:availabilityId/breaks/:breakId
 */
export const deleteEmployeeBreak = async (req, res) => {
  try {
    const { employeeId, availabilityId, breakId } = req.params;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify availability rule exists
    const availabilityRule = await db.select().from(employeeAvailability)
      .where(and(
        eq(employeeAvailability.id, availabilityId),
        eq(employeeAvailability.employeeId, employeeId)
      ))
      .limit(1);

    if (!availabilityRule.length) {
      return res.status(404).json({ message: 'Availability rule not found' });
    }

    // Verify break exists
    const existingBreak = await db.select().from(employeeBreaks)
      .where(and(
        eq(employeeBreaks.id, breakId),
        eq(employeeBreaks.employeeAvailabilityId, availabilityId)
      ))
      .limit(1);

    if (!existingBreak.length) {
      return res.status(404).json({ message: 'Break not found' });
    }

    // Delete the break
    await db.delete(employeeBreaks).where(eq(employeeBreaks.id, breakId));

    res.json({
      success: true,
      message: 'Employee break deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee break error:', error);
    res.status(500).json({
      message: 'Failed to delete employee break',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================
// EMPLOYEE SPECIAL DATES
// ============================

/**
 * Get all special dates for an employee
 * GET /api/employees/:employeeId/special-dates
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD (optional date range)
 */
export const getEmployeeSpecialDates = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to } = req.query;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Build query with optional date range
    let query = db.select().from(employeeSpecialDates).where(eq(employeeSpecialDates.employeeId, employeeId));

    if (from && to) {
      query = db.select().from(employeeSpecialDates)
        .where(and(
          eq(employeeSpecialDates.employeeId, employeeId),
          gte(employeeSpecialDates.date, from),
          lte(employeeSpecialDates.date, to)
        ));
    } else if (from) {
      query = db.select().from(employeeSpecialDates)
        .where(and(
          eq(employeeSpecialDates.employeeId, employeeId),
          gte(employeeSpecialDates.date, from)
        ));
    } else if (to) {
      query = db.select().from(employeeSpecialDates)
        .where(and(
          eq(employeeSpecialDates.employeeId, employeeId),
          lte(employeeSpecialDates.date, to)
        ));
    }

    const dates = await query.orderBy(employeeSpecialDates.date);

    res.json({
      success: true,
      data: dates
    });
  } catch (error) {
    console.error('Get employee special dates error:', error);
    res.status(500).json({
      message: 'Failed to retrieve employee special dates',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a special date for an employee
 * POST /api/employees/:employeeId/special-dates
 * Body: { date, isAvailable, startTime, endTime, reason }
 */
export const createEmployeeSpecialDate = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date, isAvailable, startTime, endTime, reason } = req.body;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
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

      if (startTime && endTime && startTime >= endTime) {
        return res.status(400).json({ message: 'startTime must be before endTime' });
      }

      if (isAvailable && (startTime || endTime) && !(startTime && endTime)) {
        return res.status(400).json({
          message: 'Both startTime and endTime must be provided for custom hours'
        });
      }
    }

    // Create special date
    const newSpecialDate = {
      id: randomUUID(),
      employeeId,
      date,
      isAvailable: isAvailable !== undefined ? isAvailable : false,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: reason || null,
      createdAt: new Date().toISOString()
    };

    await db.insert(employeeSpecialDates).values(newSpecialDate);

    res.status(201).json({
      success: true,
      message: 'Employee special date created successfully',
      data: newSpecialDate
    });
  } catch (error) {
    console.error('Create employee special date error:', error);
    res.status(500).json({
      message: 'Failed to create employee special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an employee special date
 * PUT /api/employees/:employeeId/special-dates/:specialDateId
 * Body: { date, isAvailable, startTime, endTime, reason }
 */
export const updateEmployeeSpecialDate = async (req, res) => {
  try {
    const { employeeId, specialDateId } = req.params;
    const { date, isAvailable, startTime, endTime, reason } = req.body;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify special date exists
    const existingSpecialDate = await db.select().from(employeeSpecialDates)
      .where(and(
        eq(employeeSpecialDates.id, specialDateId),
        eq(employeeSpecialDates.employeeId, employeeId)
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

    if (reason !== undefined) {
      updates.reason = reason;
    }

    await db.update(employeeSpecialDates)
      .set(updates)
      .where(eq(employeeSpecialDates.id, specialDateId));

    const updatedSpecialDate = await db.select().from(employeeSpecialDates)
      .where(eq(employeeSpecialDates.id, specialDateId))
      .limit(1);

    res.json({
      success: true,
      message: 'Employee special date updated successfully',
      data: updatedSpecialDate[0]
    });
  } catch (error) {
    console.error('Update employee special date error:', error);
    res.status(500).json({
      message: 'Failed to update employee special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an employee special date
 * DELETE /api/employees/:employeeId/special-dates/:specialDateId
 */
export const deleteEmployeeSpecialDate = async (req, res) => {
  try {
    const { employeeId, specialDateId } = req.params;
    const userId = req.user.id;

    const verification = await verifyEmployeeOwnership(employeeId, userId);
    if (verification.error) {
      return res.status(verification.status).json({ message: verification.error });
    }

    // Verify special date exists
    const existingSpecialDate = await db.select().from(employeeSpecialDates)
      .where(and(
        eq(employeeSpecialDates.id, specialDateId),
        eq(employeeSpecialDates.employeeId, employeeId)
      ))
      .limit(1);

    if (!existingSpecialDate.length) {
      return res.status(404).json({ message: 'Special date not found' });
    }

    // Delete the special date
    await db.delete(employeeSpecialDates).where(eq(employeeSpecialDates.id, specialDateId));

    res.json({
      success: true,
      message: 'Employee special date deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee special date error:', error);
    res.status(500).json({
      message: 'Failed to delete employee special date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getEmployeeAvailability,
  createEmployeeAvailability,
  updateEmployeeAvailability,
  deleteEmployeeAvailability,
  copyBusinessAvailability,
  createEmployeeBreak,
  deleteEmployeeBreak,
  getEmployeeSpecialDates,
  createEmployeeSpecialDate,
  updateEmployeeSpecialDate,
  deleteEmployeeSpecialDate,
};
