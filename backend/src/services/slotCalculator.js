import db from '../config/database.js';
import { availability, breaks, specialDates, appointments, services, businesses } from '../config/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * SLOT CALCULATION ENGINE
 *
 * Calculates available time slots for appointment booking based on:
 * - Business working hours
 * - Service duration
 * - Break periods
 * - Special dates (holidays, custom hours)
 * - Existing appointments
 * - Capacity mode and limits
 */

/**
 * Format time string to HH:MM format
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @returns {string} Time in HH:MM format
 */
function formatTime(time) {
  if (!time) return null;
  const parts = time.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:MM format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get day of week from date (0 = Sunday, 6 = Saturday)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {number} Day of week (0-6)
 */
function getDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.getDay();
}

/**
 * Check if two time ranges overlap
 * @param {number} start1 - Start time in minutes
 * @param {number} end1 - End time in minutes
 * @param {number} start2 - Start time in minutes
 * @param {number} end2 - End time in minutes
 * @returns {boolean} True if ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && end1 > start2;
}

/**
 * Get working hours for a specific date
 * Considers special dates which override standard availability
 *
 * @param {string} businessId - Business ID
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Working hours object or null if closed
 */
export async function getWorkingHoursForDate(businessId, dateStr) {
  // First, check for special date override
  const specialDate = await db.select().from(specialDates)
    .where(and(
      eq(specialDates.businessId, businessId),
      eq(specialDates.date, dateStr)
    ))
    .limit(1);

  // If special date exists
  if (specialDate.length > 0) {
    const special = specialDate[0];

    // If marked as unavailable (holiday)
    if (!special.isAvailable) {
      return null;
    }

    // If custom hours are set
    if (special.startTime && special.endTime) {
      return {
        startTime: formatTime(special.startTime),
        endTime: formatTime(special.endTime),
        capacityOverride: special.capacityOverride,
        isSpecialDate: true
      };
    }
  }

  // Get standard availability for this day of week
  const dayOfWeek = getDayOfWeek(dateStr);

  const availabilityRules = await db.select().from(availability)
    .where(and(
      eq(availability.businessId, businessId),
      eq(availability.dayOfWeek, dayOfWeek)
    ))
    .limit(1);

  if (availabilityRules.length === 0) {
    return null; // No availability set for this day
  }

  const rule = availabilityRules[0];

  // If marked as unavailable
  if (!rule.isAvailable) {
    return null;
  }

  return {
    startTime: formatTime(rule.startTime),
    endTime: formatTime(rule.endTime),
    capacityOverride: rule.capacityOverride,
    availabilityId: rule.id,
    isSpecialDate: false
  };
}

/**
 * Get break periods for a specific availability rule
 *
 * @param {string} availabilityId - Availability rule ID
 * @returns {Promise<Array>} Array of break periods with start and end times
 */
export async function getBreaksForAvailability(availabilityId) {
  if (!availabilityId) return [];

  const breakPeriods = await db.select().from(breaks)
    .where(eq(breaks.availabilityId, availabilityId))
    .orderBy(breaks.breakStart);

  return breakPeriods.map(b => ({
    start: formatTime(b.breakStart),
    end: formatTime(b.breakEnd)
  }));
}

/**
 * Get existing appointments for a specific date and service
 *
 * @param {string} businessId - Business ID
 * @param {string} serviceId - Service ID
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} excludeAppointmentId - Optional appointment ID to exclude (for rescheduling)
 * @returns {Promise<Array>} Array of appointments with start and end times
 */
export async function getExistingAppointments(businessId, serviceId, dateStr, excludeAppointmentId = null) {
  const existingAppointments = await db.select().from(appointments)
    .where(and(
      eq(appointments.businessId, businessId),
      eq(appointments.serviceId, serviceId),
      eq(appointments.appointmentDate, dateStr),
      // Only consider confirmed or pending appointments
      // (not cancelled or no-show)
    ));

  // Filter out cancelled, no-show appointments, and excluded appointment
  const activeAppointments = existingAppointments.filter(
    apt => apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW' && apt.id !== excludeAppointmentId
  );

  return activeAppointments.map(apt => ({
    start: formatTime(apt.startTime),
    end: formatTime(apt.endTime),
    status: apt.status
  }));
}

/**
 * Calculate available time slots for a specific date and service
 *
 * @param {string} businessId - Business ID
 * @param {string} serviceId - Service ID
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} excludeAppointmentId - Optional appointment ID to exclude (for rescheduling)
 * @param {boolean} allowPastSlots - If true, includes past time slots (for admin/business users)
 * @returns {Promise<Object>} Object with available slots and metadata
 */
export async function calculateAvailableSlots(businessId, serviceId, dateStr, excludeAppointmentId = null, allowPastSlots = false) {
  try {
    // Validate inputs
    if (!businessId || !serviceId || !dateStr) {
      throw new Error('businessId, serviceId, and date are required');
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Check if date is in the past (compare date strings to avoid timezone issues)
    // Only block past dates for public bookings (clients)
    // Business users (allowPastSlots=true) can create appointments for past dates
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    if (!allowPastSlots && dateStr < todayStr) {
      return {
        date: dateStr,
        available: false,
        reason: 'Date is in the past',
        slots: []
      };
    }

    // Get business details
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business.length) {
      throw new Error('Business not found');
    }

    const businessData = business[0];

    // Get service details
    const service = await db.select().from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.businessId, businessId)
      ))
      .limit(1);

    if (!service.length) {
      throw new Error('Service not found');
    }

    if (!service[0].isActive) {
      return {
        date: dateStr,
        available: false,
        reason: 'Service is not active',
        slots: []
      };
    }

    const serviceData = service[0];
    const serviceDuration = serviceData.duration; // in minutes

    // Get working hours for this date
    const workingHours = await getWorkingHoursForDate(businessId, dateStr);

    if (!workingHours) {
      return {
        date: dateStr,
        available: false,
        reason: 'Business is closed on this date',
        slots: []
      };
    }

    // Get breaks (only for non-special dates)
    const breakPeriods = workingHours.isSpecialDate
      ? []
      : await getBreaksForAvailability(workingHours.availabilityId);

    // Get existing appointments
    const existingAppointments = await getExistingAppointments(businessId, serviceId, dateStr, excludeAppointmentId);

    // Determine capacity (use ?? instead of || to allow 0 for unlimited)
    const capacity = workingHours.capacityOverride ?? businessData.defaultCapacity ?? 1;

    const capacityMode = businessData.capacityMode || 'SINGLE';

    // Calculate slot interval
    // For proper slot generation, use the configured interval from business settings
    const configuredInterval = businessData.defaultSlotInterval || 15;

    // Slot interval logic depends on capacity mode:
    // - SINGLE mode: Use max of (configured interval, service duration) to avoid overlaps
    // - MULTIPLE mode: Use configured interval to allow overlapping bookings
    let slotInterval;
    if (capacityMode === 'SINGLE') {
      // For single appointments, slots should not overlap
      // If service is 60 min and interval is 15 min, use 60 min intervals
      slotInterval = Math.max(configuredInterval, serviceDuration);
    } else {
      // For multiple concurrent appointments, keep configured interval
      // but ensure service can fit within working hours
      slotInterval = configuredInterval;
    }

    // Convert times to minutes
    const dayStart = timeToMinutes(workingHours.startTime);
    const dayEnd = timeToMinutes(workingHours.endTime);

    // Check if this is today and get current time for filtering past slots
    const isToday = dateStr === todayStr;
    const currentMinutes = isToday ? (today.getHours() * 60 + today.getMinutes()) : 0;

    // Generate all possible slots based on interval
    const possibleSlots = [];
    let currentTime = dayStart;

    while (currentTime + serviceDuration <= dayEnd) {
      const slotStart = currentTime;
      const slotEnd = currentTime + serviceDuration;

      // For clients (allowPastSlots=false), skip past time slots for today
      // For admins (allowPastSlots=true), include all time slots
      const isPastSlot = isToday && slotEnd <= currentMinutes;
      if (!allowPastSlots && isPastSlot) {
        currentTime += slotInterval;
        continue;
      }

      possibleSlots.push({
        start: minutesToTime(slotStart),
        end: minutesToTime(slotEnd),
        startMinutes: slotStart,
        endMinutes: slotEnd
      });

      currentTime += slotInterval;
    }

    // Filter out slots that overlap with breaks
    const slotsAfterBreaks = possibleSlots.filter(slot => {
      for (const breakPeriod of breakPeriods) {
        const breakStart = timeToMinutes(breakPeriod.start);
        const breakEnd = timeToMinutes(breakPeriod.end);

        if (timeRangesOverlap(slot.startMinutes, slot.endMinutes, breakStart, breakEnd)) {
          return false;
        }
      }
      return true;
    });

    // Check availability for all slots and mark them as available or unavailable
    // This allows the frontend to show all slots but disable the unavailable ones
    const allSlots = [];

    for (const slot of slotsAfterBreaks) {
      if (capacityMode === 'SINGLE') {
        // In SINGLE mode, slot is available if no appointments overlap
        let hasConflict = false;

        for (const apt of existingAppointments) {
          const aptStart = timeToMinutes(apt.start);
          const aptEnd = timeToMinutes(apt.end);

          if (timeRangesOverlap(slot.startMinutes, slot.endMinutes, aptStart, aptEnd)) {
            hasConflict = true;
            break;
          }
        }

        allSlots.push({
          startTime: slot.start,
          endTime: slot.end,
          available: !hasConflict
        });
      } else {
        // MULTIPLE mode: count overlapping appointments
        let overlappingCount = 0;

        for (const apt of existingAppointments) {
          const aptStart = timeToMinutes(apt.start);
          const aptEnd = timeToMinutes(apt.end);

          if (timeRangesOverlap(slot.startMinutes, slot.endMinutes, aptStart, aptEnd)) {
            overlappingCount++;
          }
        }

        // Slot is available if under capacity (capacity = 0 means unlimited)
        const isAvailable = capacity === 0 || overlappingCount < capacity;
        const spotsLeft = capacity === 0 ? 'unlimited' : Math.max(0, capacity - overlappingCount);

        allSlots.push({
          startTime: slot.start,
          endTime: slot.end,
          available: isAvailable,
          spotsLeft,
          totalCapacity: capacity === 0 ? 'unlimited' : capacity
        });
      }
    }

    // Separate available and unavailable slots
    const availableSlots = allSlots.filter(slot => slot.available);

    return {
      date: dateStr,
      available: availableSlots.length > 0,
      workingHours: {
        start: workingHours.startTime,
        end: workingHours.endTime
      },
      service: {
        id: serviceData.id,
        name: serviceData.name,
        duration: serviceDuration
      },
      capacityMode,
      capacity,
      breaks: breakPeriods,
      slots: allSlots, // Return all slots with availability status
      availableSlots, // Separate list of only available slots for backward compatibility
      totalSlots: allSlots.length,
      availableSlotsCount: availableSlots.length
    };

  } catch (error) {
    console.error('Slot calculation error:', error);
    throw error;
  }
}

/**
 * Calculate available slots for a date range
 *
 * @param {string} businessId - Business ID
 * @param {string} serviceId - Service ID
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {boolean} allowPastSlots - If true, includes past time slots (for admin/business users)
 * @returns {Promise<Array>} Array of date objects with availability
 */
export async function calculateAvailableSlotsForRange(businessId, serviceId, startDate, endDate, allowPastSlots = false) {
  const results = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Limit to 30 days maximum
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    throw new Error('Date range cannot exceed 30 days');
  }

  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const slots = await calculateAvailableSlots(businessId, serviceId, dateStr, null, allowPastSlots);
    results.push(slots);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return results;
}

export default {
  calculateAvailableSlots,
  calculateAvailableSlotsForRange,
  getWorkingHoursForDate,
  getBreaksForAvailability,
  getExistingAppointments
};
