import { describe, it, expect, vi } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateToken,
  validateAvailability,
} from '../../src/middleware/validation.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function mockReqRes(body = {}, method = 'POST') {
  const req = { body: { ...body }, method };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
}

// Convenience: run a middleware and return whether next() was called
function passes(middleware, body, method = 'POST') {
  const { req, res, next } = mockReqRes(body, method);
  middleware(req, res, next);
  return { calledNext: next.mock.calls.length > 0, req, res };
}

function rejects(middleware, body, expectedError, method = 'POST') {
  const { req, res, next } = mockReqRes(body, method);
  middleware(req, res, next);
  expect(next).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(400);
  if (expectedError) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: expect.stringContaining(expectedError) })
    );
  }
}

// ─── validateEmail ─────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('passes and lowercases a valid email', () => {
    const { calledNext, req } = passes(validateEmail, { email: 'User@Example.COM' });
    expect(calledNext).toBe(true);
    expect(req.body.email).toBe('user@example.com');
  });

  it('rejects when email is missing', () => {
    rejects(validateEmail, {}, 'Email is required');
  });

  it('rejects an email with no @ symbol', () => {
    rejects(validateEmail, { email: 'notanemail' }, 'valid email');
  });

  it('rejects an email with no domain', () => {
    rejects(validateEmail, { email: 'user@' }, 'valid email');
  });

  it('rejects an email with spaces', () => {
    rejects(validateEmail, { email: 'user @domain.com' }, 'valid email');
  });

  it('accepts a valid email with subdomains', () => {
    const { calledNext } = passes(validateEmail, { email: 'user@mail.domain.co.uk' });
    expect(calledNext).toBe(true);
  });
});

// ─── validatePassword ──────────────────────────────────────────────────────

describe('validatePassword', () => {
  const validPassword = 'SecurePass1!';

  it('passes a strong password', () => {
    const { calledNext } = passes(validatePassword, { password: validPassword });
    expect(calledNext).toBe(true);
  });

  it('also checks newPassword field (for reset flow)', () => {
    const { calledNext } = passes(validatePassword, { newPassword: validPassword });
    expect(calledNext).toBe(true);
  });

  it('rejects when password is missing', () => {
    rejects(validatePassword, {}, 'Password is required');
  });

  it('rejects a password shorter than 8 characters', () => {
    rejects(validatePassword, { password: 'Ab1!' }, '8 characters');
  });

  it('rejects a password with no uppercase letter', () => {
    rejects(validatePassword, { password: 'secure1!' }, 'uppercase');
  });

  it('rejects a password with no lowercase letter', () => {
    rejects(validatePassword, { password: 'SECURE1!' }, 'lowercase');
  });

  it('rejects a password with no number', () => {
    rejects(validatePassword, { password: 'SecurePass!' }, 'number');
  });

  it('rejects a password with no special character', () => {
    rejects(validatePassword, { password: 'SecurePass1' }, 'special character');
  });
});

// ─── validateRegistration ──────────────────────────────────────────────────

describe('validateRegistration', () => {
  const validBody = { firstName: 'John', lastName: 'Doe', phone: '+1 (555) 123-4567' };

  it('passes valid registration data and trims names', () => {
    const { calledNext, req } = passes(validateRegistration, {
      firstName: '  John  ',
      lastName: '  Doe  ',
    });
    expect(calledNext).toBe(true);
    expect(req.body.firstName).toBe('John');
    expect(req.body.lastName).toBe('Doe');
  });

  it('rejects when first name is missing', () => {
    rejects(validateRegistration, { lastName: 'Doe' }, 'First name');
  });

  it('rejects a first name shorter than 2 characters', () => {
    rejects(validateRegistration, { firstName: 'J', lastName: 'Doe' }, 'First name');
  });

  it('rejects when last name is missing', () => {
    rejects(validateRegistration, { firstName: 'John' }, 'Last name');
  });

  it('rejects a last name shorter than 2 characters', () => {
    rejects(validateRegistration, { firstName: 'John', lastName: 'D' }, 'Last name');
  });

  it('passes when phone is omitted (phone is optional)', () => {
    const { calledNext } = passes(validateRegistration, { firstName: 'John', lastName: 'Doe' });
    expect(calledNext).toBe(true);
  });

  it('passes with a valid international phone number', () => {
    const { calledNext } = passes(validateRegistration, { ...validBody });
    expect(calledNext).toBe(true);
  });

  it('rejects a phone number with fewer than 10 digits', () => {
    rejects(validateRegistration, { firstName: 'John', lastName: 'Doe', phone: '12345' }, 'phone number');
  });

  it('rejects a phone number with non-numeric, non-separator characters', () => {
    rejects(validateRegistration, { firstName: 'John', lastName: 'Doe', phone: 'abc-def-ghij' }, 'phone number');
  });
});

// ─── validateToken ─────────────────────────────────────────────────────────

describe('validateToken', () => {
  it('passes a non-empty token', () => {
    const { calledNext } = passes(validateToken, { token: 'abc123' });
    expect(calledNext).toBe(true);
  });

  it('rejects when token is missing', () => {
    rejects(validateToken, {}, 'Token is required');
  });

  it('rejects an empty string token', () => {
    rejects(validateToken, { token: '   ' }, 'Token is required');
  });
});

// ─── validateAvailability ──────────────────────────────────────────────────

describe('validateAvailability', () => {
  const validBody = { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' };

  it('passes valid availability data on POST', () => {
    const { calledNext } = passes(validateAvailability, validBody, 'POST');
    expect(calledNext).toBe(true);
  });

  it('passes partial data on PUT (no dayOfWeek required)', () => {
    const { calledNext } = passes(validateAvailability, { startTime: '10:00', endTime: '18:00' }, 'PUT');
    expect(calledNext).toBe(true);
  });

  it('rejects missing dayOfWeek on POST', () => {
    rejects(validateAvailability, { startTime: '09:00', endTime: '17:00' }, 'dayOfWeek', 'POST');
  });

  it('rejects dayOfWeek outside 0–6', () => {
    rejects(validateAvailability, { dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }, 'dayOfWeek', 'POST');
  });

  it('rejects dayOfWeek below 0', () => {
    rejects(validateAvailability, { dayOfWeek: -1, startTime: '09:00', endTime: '17:00' }, 'dayOfWeek', 'POST');
  });

  it('rejects invalid startTime format', () => {
    rejects(validateAvailability, { dayOfWeek: 1, startTime: '9am', endTime: '17:00' }, 'startTime', 'POST');
  });

  it('rejects invalid endTime format', () => {
    rejects(validateAvailability, { dayOfWeek: 1, startTime: '09:00', endTime: '5pm' }, 'endTime', 'POST');
  });

  it('rejects when startTime is not before endTime', () => {
    rejects(validateAvailability, { dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }, 'before endTime', 'POST');
  });

  it('rejects when startTime equals endTime', () => {
    rejects(validateAvailability, { dayOfWeek: 1, startTime: '09:00', endTime: '09:00' }, 'before endTime', 'POST');
  });

  it('accepts time in HH:MM:SS format', () => {
    const { calledNext } = passes(validateAvailability, { dayOfWeek: 1, startTime: '09:00:00', endTime: '17:00:00' }, 'POST');
    expect(calledNext).toBe(true);
  });
});
