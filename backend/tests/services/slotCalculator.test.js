import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * SLOT CALCULATOR TESTS
 *
 * Strategy: mock the Drizzle ORM `db` object so tests never touch the real database.
 *
 * `calculateAvailableSlots` makes several sequential DB calls. We use a queue:
 * each call to `db.select()` consumes the next item from `dbQueue` and resolves to it.
 *
 * Call order for the most common path (no employee, no special date):
 *   1. businesses      (get business settings)
 *   2. services        (get service details)
 *   3. specialDates    (check for holiday override)  → inside getWorkingHoursForDate
 *   4. availability    (get standard working hours)  → inside getWorkingHoursForDate
 *   5. breaks          (get break periods)           → inside getBreaksForAvailability
 *   6. appointments    (get existing bookings)       → inside getExistingAppointments
 *
 * Each test comment documents the expected call order for that specific scenario.
 */

// ─── Mock setup ────────────────────────────────────────────────────────────

// vi.hoisted runs before imports, creating state that both the mock factory
// and the test body can share.
const { dbQueue, resetQueue } = vi.hoisted(() => {
  const dbQueue = { items: [] };
  const resetQueue = (...items) => { dbQueue.items = items; };
  return { dbQueue, resetQueue };
});

// A mock Drizzle chain that is both chainable AND directly awaitable.
// Each call to db.select() consumes the next result from dbQueue.
vi.mock('../../src/config/database.js', () => {
  function makeChain() {
    const result = dbQueue.items.shift() ?? [];
    const chain = {
      from:    () => chain,
      where:   () => chain,
      limit:   () => Promise.resolve(result),
      orderBy: () => Promise.resolve(result),
      // Make the chain directly awaitable (for queries that end at .where())
      then:    (resolve, reject) => Promise.resolve(result).then(resolve, reject),
      catch:   (reject) => Promise.resolve(result).catch(reject),
    };
    return chain;
  }

  return {
    default: {
      select: () => makeChain(),
      query: {
        employeeServices: {
          findMany: () => Promise.resolve(dbQueue.items.shift() ?? []),
        },
      },
    },
  };
});

// Schema tables are just reference objects — the mock db ignores what's passed to from()
vi.mock('../../src/config/schema.js', () => ({
  availability:           { _: { name: 'availability' } },
  breaks:                 { _: { name: 'breaks' } },
  specialDates:           { _: { name: 'specialDates' } },
  appointments:           { _: { name: 'appointments' } },
  services:               { _: { name: 'services' } },
  businesses:             { _: { name: 'businesses' } },
  employees:              { _: { name: 'employees' } },
  employeeAvailability:   { _: { name: 'employeeAvailability' } },
  employeeBreaks:         { _: { name: 'employeeBreaks' } },
  employeeSpecialDates:   { _: { name: 'employeeSpecialDates' } },
  employeeServices:       { _: { name: 'employeeServices' } },
}));

vi.mock('drizzle-orm', () => ({
  eq:  (field, value) => ({ type: 'eq', field, value }),
  and: (...conditions) => ({ type: 'and', conditions }),
  gt:  (field, value) => ({ type: 'gt', field, value }),
}));

// ─── Import after mocks ────────────────────────────────────────────────────

import {
  calculateAvailableSlots,
  getWorkingHoursForDate,
  getBreaksForAvailability,
  getExistingAppointments,
} from '../../src/services/slotCalculator.js';

// ─── Common fixtures ───────────────────────────────────────────────────────

const BUSINESS_ID  = 'biz-1';
const SERVICE_ID   = 'svc-1';
const EMPLOYEE_ID  = 'emp-1';

// A far-future Monday so the "past date" guard never fires
const FUTURE_DATE = '2099-06-15';

const mockBusiness = {
  id: BUSINESS_ID,
  capacityMode: 'SINGLE',
  defaultCapacity: 1,
  defaultSlotInterval: 15,
  settings: {},
  requireEmailConfirmation: false,
};

const mockService = {
  id: SERVICE_ID,
  businessId: BUSINESS_ID,
  name: 'Test Service',
  duration: 60,   // minutes
  isActive: true,
  customCapacity: null,
};

const mockAvailability = {
  id: 'avail-1',
  businessId: BUSINESS_ID,
  dayOfWeek: 1,
  startTime: '09:00:00',
  endTime: '17:00:00',
  isAvailable: true,
  capacityOverride: null,
};

// Helper: build a confirmed appointment at a given start time (HH:MM:SS)
function makeAppointment(startTime, endTime, overrides = {}) {
  return {
    id: `apt-${startTime}`,
    businessId: BUSINESS_ID,
    serviceId: SERVICE_ID,
    appointmentDate: FUTURE_DATE,
    startTime,
    endTime,
    status: 'CONFIRMED',
    employeeId: null,
    isEmailConfirmed: true,
    emailConfirmationToken: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  dbQueue.items = [];
});

// ─── Input validation ──────────────────────────────────────────────────────

describe('calculateAvailableSlots — input validation', () => {
  it('throws when businessId is missing', async () => {
    await expect(calculateAvailableSlots(null, SERVICE_ID, FUTURE_DATE))
      .rejects.toThrow('required');
  });

  it('throws when serviceId is missing', async () => {
    await expect(calculateAvailableSlots(BUSINESS_ID, null, FUTURE_DATE))
      .rejects.toThrow('required');
  });

  it('throws when date is missing', async () => {
    await expect(calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, null))
      .rejects.toThrow('required');
  });

  it('throws for an invalid date format', async () => {
    await expect(calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, '15-06-2099'))
      .rejects.toThrow('Invalid date format');
  });

  it('throws for a date with letters', async () => {
    await expect(calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, 'not-a-date'))
      .rejects.toThrow();
  });
});

// ─── Past date guard ────────────────────────────────────────────────────────

describe('calculateAvailableSlots — past date handling', () => {
  it('returns available:false for a past date when allowPastSlots=false', async () => {
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, '2000-01-01');
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/past/i);
    expect(result.slots).toHaveLength(0);
  });

  it('does not block past dates when allowPastSlots=true (proceeds to DB)', async () => {
    // Queue enough data for the business/service/availability queries
    // Call order: businesses, services, specialDates, availability, breaks, appointments
    resetQueue(
      [mockBusiness],
      [mockService],
      [],               // no special date
      [mockAvailability],
      [],               // no breaks
      [],               // no appointments
    );
    // Should not reject — past guard is bypassed
    const result = await calculateAvailableSlots(
      BUSINESS_ID, SERVICE_ID, '2000-01-01', null, true
    );
    expect(result).toHaveProperty('slots');
  });
});

// ─── Closed day ─────────────────────────────────────────────────────────────

describe('calculateAvailableSlots — business closed', () => {
  it('returns available:false when the day is a holiday (special date, isAvailable:false)', async () => {
    // Call order: businesses, services, specialDates
    resetQueue(
      [mockBusiness],
      [mockService],
      [{ isAvailable: false }], // holiday
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/closed/i);
    expect(result.slots).toHaveLength(0);
  });

  it('returns available:false when no availability rule exists for the day', async () => {
    // Call order: businesses, services, specialDates (none), availability (none)
    resetQueue(
      [mockBusiness],
      [mockService],
      [],   // no special date
      [],   // no availability for this day of week
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/closed/i);
  });

  it('returns available:false when the availability rule has isAvailable:false', async () => {
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [{ ...mockAvailability, isAvailable: false }],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(false);
  });

  it('returns available:false when service is inactive', async () => {
    resetQueue(
      [mockBusiness],
      [{ ...mockService, isActive: false }],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/not active/i);
  });
});

// ─── Normal working day ──────────────────────────────────────────────────────

describe('calculateAvailableSlots — normal working day', () => {
  it('returns 8 slots for a 09:00–17:00 day with 60-min service and no bookings', async () => {
    // SINGLE mode: slotInterval = max(15, 60) = 60 → 8 slots: 09–10, 10–11, ..., 16–17
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],   // no breaks
      [],   // no appointments
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(true);
    expect(result.slots).toHaveLength(8);
    expect(result.availableSlots).toHaveLength(8);
    expect(result.slots[0].startTime).toBe('09:00');
    expect(result.slots[0].endTime).toBe('10:00');
    expect(result.slots[7].startTime).toBe('16:00');
    expect(result.slots[7].endTime).toBe('17:00');
  });

  it('includes the last slot when it fits exactly at the end of the day', async () => {
    // 16:00 + 60min = 17:00 = dayEnd → must be included
    resetQueue([mockBusiness], [mockService], [], [mockAvailability], [], []);
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const lastSlot = result.slots[result.slots.length - 1];
    expect(lastSlot.startTime).toBe('16:00');
    expect(lastSlot.endTime).toBe('17:00');
  });

  it('excludes a slot that would extend past the end of the day', async () => {
    // 16:30 + 60min = 17:30 > 17:00 → should NOT appear
    resetQueue([mockBusiness], [mockService], [], [mockAvailability], [], []);
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotStarts = result.slots.map(s => s.startTime);
    expect(slotStarts).not.toContain('16:30');
  });

  it('returns zero slots when the service is longer than the working hours window', async () => {
    const shortDay = { ...mockAvailability, startTime: '09:00:00', endTime: '09:30:00' };
    resetQueue(
      [mockBusiness],
      [{ ...mockService, duration: 60 }],  // 60min service can't fit in a 30min window
      [],
      [shortDay],
      [],
      [],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.slots).toHaveLength(0);
    expect(result.available).toBe(false);
  });

  it('returns correct working hours metadata', async () => {
    resetQueue([mockBusiness], [mockService], [], [mockAvailability], [], []);
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.workingHours).toEqual({ start: '09:00', end: '17:00' });
  });
});

// ─── Break periods ──────────────────────────────────────────────────────────

describe('calculateAvailableSlots — break periods', () => {
  it('removes the slot that starts during a lunch break (12:00–13:00)', async () => {
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [{ breakStart: '12:00:00', breakEnd: '13:00:00' }],
      [],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotStarts = result.slots.map(s => s.startTime);
    expect(slotStarts).not.toContain('12:00');
  });

  it('keeps the slot that ends exactly when a break starts (11:00–12:00 with break 12:00–13:00)', async () => {
    // timeRangesOverlap(660, 720, 720, 780) → 660 < 780 && 720 > 720 → false — slot is kept
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [{ breakStart: '12:00:00', breakEnd: '13:00:00' }],
      [],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotStarts = result.slots.map(s => s.startTime);
    expect(slotStarts).toContain('11:00');
  });

  it('returns 7 slots (not 8) with a 1-hour lunch break', async () => {
    // Removed slot: 12:00–13:00 → 7 remaining
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [{ breakStart: '12:00:00', breakEnd: '13:00:00' }],
      [],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.slots).toHaveLength(7);
  });

  it('removes multiple slots overlapping multiple breaks', async () => {
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [
        { breakStart: '10:00:00', breakEnd: '11:00:00' },
        { breakStart: '13:00:00', breakEnd: '14:00:00' },
      ],
      [],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotStarts = result.slots.map(s => s.startTime);
    expect(slotStarts).not.toContain('10:00');
    expect(slotStarts).not.toContain('13:00');
    expect(result.slots).toHaveLength(6);
  });
});

// ─── Fully booked day (SINGLE mode) ─────────────────────────────────────────

describe('calculateAvailableSlots — fully booked (SINGLE mode)', () => {
  it('marks all slots unavailable when each slot has a confirmed booking', async () => {
    const bookedAppointments = [
      makeAppointment('09:00:00', '10:00:00'),
      makeAppointment('10:00:00', '11:00:00'),
      makeAppointment('11:00:00', '12:00:00'),
      makeAppointment('12:00:00', '13:00:00'),
      makeAppointment('13:00:00', '14:00:00'),
      makeAppointment('14:00:00', '15:00:00'),
      makeAppointment('15:00:00', '16:00:00'),
      makeAppointment('16:00:00', '17:00:00'),
    ];
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      bookedAppointments,
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(false);
    expect(result.availableSlots).toHaveLength(0);
    result.slots.forEach(slot => expect(slot.available).toBe(false));
  });

  it('leaves a slot available if its booking is CANCELLED', async () => {
    // Only one appointment, but it's cancelled — slot should be free
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00', { status: 'CANCELLED' })],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const firstSlot = result.slots.find(s => s.startTime === '09:00');
    expect(firstSlot?.available).toBe(true);
  });

  it('leaves a slot available if its booking is NO_SHOW', async () => {
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00', { status: 'NO_SHOW' })],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const firstSlot = result.slots.find(s => s.startTime === '09:00');
    expect(firstSlot?.available).toBe(true);
  });

  it('has exactly one unavailable slot when only one slot is booked', async () => {
    resetQueue(
      [mockBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00')],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const unavailable = result.slots.filter(s => !s.available);
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0].startTime).toBe('09:00');
    expect(result.availableSlots).toHaveLength(7);
  });
});

// ─── Buffer time ─────────────────────────────────────────────────────────────

describe('calculateAvailableSlots — buffer time between appointments', () => {
  it('blocks the slot immediately after an appointment when bufferTime is set', async () => {
    // bufferTime: 10 min, appointment 09:00–10:00
    // → aptEndWithBuffer = 10:10 → slot 10:00–11:00 overlaps (10:00 < 10:10) → blocked
    const businessWithBuffer = { ...mockBusiness, settings: { bufferTime: 10 } };
    resetQueue(
      [businessWithBuffer],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00')],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotAt10 = result.slots.find(s => s.startTime === '10:00');
    expect(slotAt10?.available).toBe(false);
  });

  it('does not block slots beyond the buffer window', async () => {
    // bufferTime: 10 min → apt 09:00–10:00 → 11:00–12:00 should be free
    const businessWithBuffer = { ...mockBusiness, settings: { bufferTime: 10 } };
    resetQueue(
      [businessWithBuffer],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00')],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const slotAt11 = result.slots.find(s => s.startTime === '11:00');
    expect(slotAt11?.available).toBe(true);
  });
});

// ─── Special date (custom hours) ─────────────────────────────────────────────

describe('calculateAvailableSlots — special date with custom hours', () => {
  it('uses the special date hours instead of standard availability', async () => {
    // Special date: 10:00–12:00 → 2 slots with a 60-min service
    // Call order: businesses, services, specialDates (has custom hours), appointments
    // (no availability or breaks query since isSpecialDate=true)
    resetQueue(
      [mockBusiness],
      [mockService],
      [{ isAvailable: true, startTime: '10:00:00', endTime: '12:00:00', capacityOverride: null }],
      [],  // appointments
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.available).toBe(true);
    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].startTime).toBe('10:00');
    expect(result.slots[1].startTime).toBe('11:00');
    expect(result.workingHours).toEqual({ start: '10:00', end: '12:00' });
  });
});

// ─── MULTIPLE capacity mode ──────────────────────────────────────────────────

describe('calculateAvailableSlots — MULTIPLE capacity mode', () => {
  it('returns spotsLeft and totalCapacity on each slot', async () => {
    const multipleModeBusiness = {
      ...mockBusiness,
      capacityMode: 'MULTIPLE',
      defaultCapacity: 3,
      defaultSlotInterval: 60,
    };
    resetQueue(
      [multipleModeBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [],  // no appointments
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result.capacityMode).toBe('MULTIPLE');
    result.slots.forEach(slot => {
      expect(slot).toHaveProperty('spotsLeft');
      expect(slot).toHaveProperty('totalCapacity', 3);
    });
  });

  it('reduces spotsLeft when a slot is partially booked', async () => {
    const multipleModeBusiness = {
      ...mockBusiness,
      capacityMode: 'MULTIPLE',
      defaultCapacity: 2,
      defaultSlotInterval: 60,
    };
    resetQueue(
      [multipleModeBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [makeAppointment('09:00:00', '10:00:00')],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const firstSlot = result.slots.find(s => s.startTime === '09:00');
    expect(firstSlot?.available).toBe(true);   // still has 1 spot
    expect(firstSlot?.spotsLeft).toBe(1);
  });

  it('marks a slot unavailable when capacity is fully used', async () => {
    const multipleModeBusiness = {
      ...mockBusiness,
      capacityMode: 'MULTIPLE',
      defaultCapacity: 2,
      defaultSlotInterval: 60,
    };
    resetQueue(
      [multipleModeBusiness],
      [mockService],
      [],
      [mockAvailability],
      [],
      [
        makeAppointment('09:00:00', '10:00:00'),
        makeAppointment('09:00:00', '10:00:00', { id: 'apt-2' }),
      ],
    );
    const result = await calculateAvailableSlots(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    const firstSlot = result.slots.find(s => s.startTime === '09:00');
    expect(firstSlot?.available).toBe(false);
    expect(firstSlot?.spotsLeft).toBe(0);
  });
});

// ─── Employee-specific availability ──────────────────────────────────────────

describe('calculateAvailableSlots — employee-specific availability', () => {
  const mockEmployee = {
    id: EMPLOYEE_ID,
    businessId: BUSINESS_ID,
    name: 'Jane Doe',
    isActive: true,
    maxDailyAppointments: 0,  // 0 = no limit
  };

  const mockEmployeeAvailability = {
    id: 'emp-avail-1',
    employeeId: EMPLOYEE_ID,
    dayOfWeek: 1,
    startTime: '10:00:00',
    endTime: '16:00:00',
    isAvailable: true,
  };

  it('uses employee-specific hours instead of business hours', async () => {
    // Call order: businesses, services, employees,
    //             employeeSpecialDates (none), employeeAvailability,
    //             employeeBreaks, appointments
    resetQueue(
      [mockBusiness],
      [mockService],
      [mockEmployee],
      [],                           // no employee special date
      [mockEmployeeAvailability],   // employee works 10:00–16:00
      [],                           // no employee breaks
      [],                           // no appointments
    );
    const result = await calculateAvailableSlots(
      BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, true,
      { employeeId: EMPLOYEE_ID }
    );
    expect(result.workingHours).toEqual({ start: '10:00', end: '16:00' });
    // 10:00–16:00 with 60-min service = 6 slots
    expect(result.slots).toHaveLength(6);
    expect(result.employee?.id).toBe(EMPLOYEE_ID);
  });

  it('returns unavailable when employee is on a special day off', async () => {
    // Call order: businesses, services, employees,
    //             employeeSpecialDates (day off), done
    resetQueue(
      [mockBusiness],
      [mockService],
      [mockEmployee],
      [{ isAvailable: false }],  // employee special date: day off
    );
    const result = await calculateAvailableSlots(
      BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, true,
      { employeeId: EMPLOYEE_ID }
    );
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/not available/i);
  });

  it('returns unavailable when employee does not exist or is inactive', async () => {
    // Call order: businesses, services, employees (empty → not found)
    resetQueue(
      [mockBusiness],
      [mockService],
      [],  // employee not found
    );
    const result = await calculateAvailableSlots(
      BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, true,
      { employeeId: EMPLOYEE_ID }
    );
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/not found/i);
  });
});

// ─── Employee daily capacity limit ───────────────────────────────────────────

describe('calculateAvailableSlots — employee daily capacity limit', () => {
  it('marks all slots unavailable when employee has reached maxDailyAppointments', async () => {
    const employeeAtLimit = {
      id: EMPLOYEE_ID,
      businessId: BUSINESS_ID,
      name: 'Jane Doe',
      isActive: true,
      maxDailyAppointments: 3,
    };

    // The daily count query returns 3 confirmed appointments → at limit
    const dailyAppointments = [
      makeAppointment('09:00:00', '10:00:00', { employeeId: EMPLOYEE_ID }),
      makeAppointment('10:00:00', '11:00:00', { employeeId: EMPLOYEE_ID, id: 'apt-2' }),
      makeAppointment('11:00:00', '12:00:00', { employeeId: EMPLOYEE_ID, id: 'apt-3' }),
    ];

    const empAvail = { id: 'ea-1', employeeId: EMPLOYEE_ID, dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true };

    // Call order: businesses, services, employees,
    //             appointments (daily count), employeeSpecialDates,
    //             employeeAvailability, employeeBreaks, appointments (slot calc)
    resetQueue(
      [mockBusiness],
      [mockService],
      [employeeAtLimit],
      dailyAppointments,   // daily count query
      [],                  // no employee special date
      [empAvail],          // employee availability
      [],                  // no breaks
      [],                  // slot calc appointments
    );

    const result = await calculateAvailableSlots(
      BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, true,
      { employeeId: EMPLOYEE_ID }
    );

    expect(result.employee?.atCapacity).toBe(true);
    result.slots.forEach(slot => expect(slot.available).toBe(false));
    expect(result.availableSlots).toHaveLength(0);
  });
});

// ─── getWorkingHoursForDate (unit tests) ─────────────────────────────────────

describe('getWorkingHoursForDate', () => {
  it('returns null for a holiday special date (isAvailable: false)', async () => {
    // Call order: specialDates
    resetQueue([{ isAvailable: false }]);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toBeNull();
  });

  it('returns custom hours when special date has startTime and endTime', async () => {
    // Call order: specialDates
    resetQueue([{ isAvailable: true, startTime: '10:00:00', endTime: '14:00:00', capacityOverride: null }]);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toMatchObject({ startTime: '10:00', endTime: '14:00', isSpecialDate: true });
  });

  it('falls through to standard availability when special date has no custom hours', async () => {
    // Special date exists, isAvailable=true, but no startTime/endTime → use standard availability
    // Call order: specialDates (no times), availability
    resetQueue(
      [{ isAvailable: true, startTime: null, endTime: null }],
      [mockAvailability],
    );
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toMatchObject({ startTime: '09:00', endTime: '17:00', isSpecialDate: false });
  });

  it('returns standard working hours when no special date exists', async () => {
    // Call order: specialDates (none), availability
    resetQueue([], [mockAvailability]);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toMatchObject({ startTime: '09:00', endTime: '17:00', isSpecialDate: false });
  });

  it('returns null when no availability rule is defined for the day', async () => {
    // Call order: specialDates (none), availability (none)
    resetQueue([], []);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toBeNull();
  });

  it('returns null when availability rule has isAvailable:false', async () => {
    resetQueue([], [{ ...mockAvailability, isAvailable: false }]);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result).toBeNull();
  });

  it('includes the availabilityId (needed for fetching breaks)', async () => {
    resetQueue([], [mockAvailability]);
    const result = await getWorkingHoursForDate(BUSINESS_ID, FUTURE_DATE);
    expect(result?.availabilityId).toBe('avail-1');
  });
});

// ─── getExistingAppointments (unit tests) ────────────────────────────────────

describe('getExistingAppointments', () => {
  it('returns formatted appointments with start/end times', async () => {
    resetQueue([makeAppointment('09:00:00', '10:00:00')]);
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: '09:00', end: '10:00', status: 'CONFIRMED' });
  });

  it('filters out CANCELLED appointments', async () => {
    resetQueue([makeAppointment('09:00:00', '10:00:00', { status: 'CANCELLED' })]);
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result).toHaveLength(0);
  });

  it('filters out NO_SHOW appointments', async () => {
    resetQueue([makeAppointment('09:00:00', '10:00:00', { status: 'NO_SHOW' })]);
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE);
    expect(result).toHaveLength(0);
  });

  it('filters out the excluded appointment ID (for rescheduling)', async () => {
    const apt = makeAppointment('09:00:00', '10:00:00', { id: 'exclude-me' });
    resetQueue([apt]);
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE, 'exclude-me');
    expect(result).toHaveLength(0);
  });

  it('filters by employeeId when provided', async () => {
    const aptForEmployee = makeAppointment('09:00:00', '10:00:00', { employeeId: EMPLOYEE_ID });
    const aptForOther = makeAppointment('10:00:00', '11:00:00', { employeeId: 'other-emp', id: 'apt-2' });
    resetQueue([aptForEmployee, aptForOther]);
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, EMPLOYEE_ID);
    expect(result).toHaveLength(1);
    expect(result[0].employeeId).toBe(EMPLOYEE_ID);
  });

  it('filters out expired unconfirmed appointments when emailConfirmationTimeout is set', async () => {
    const expiredUnconfirmed = makeAppointment('09:00:00', '10:00:00', {
      status: 'PENDING',
      isEmailConfirmed: false,
      emailConfirmationToken: 'some-token',
      // Created 60 minutes ago
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    resetQueue([expiredUnconfirmed]);
    // Timeout of 15 minutes — this appointment is 60 min old, so it's expired
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, null, 15);
    expect(result).toHaveLength(0);
  });

  it('keeps unconfirmed appointments that have not yet timed out', async () => {
    const recentUnconfirmed = makeAppointment('09:00:00', '10:00:00', {
      status: 'PENDING',
      isEmailConfirmed: false,
      emailConfirmationToken: 'some-token',
      // Created 5 minutes ago
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
    resetQueue([recentUnconfirmed]);
    // Timeout of 15 minutes — 5 min old appointment should still count
    const result = await getExistingAppointments(BUSINESS_ID, SERVICE_ID, FUTURE_DATE, null, null, 15);
    expect(result).toHaveLength(1);
  });
});
