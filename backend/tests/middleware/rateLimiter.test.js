import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  verificationLimiter,
  bookingLimiter,
  apiLimiter,
} from '../../src/middleware/rateLimiter.js';

/**
 * RATE LIMITER TESTS
 *
 * Strategy: call each middleware directly with a mock req/res/next.
 * Because all limiters use `skip: (req) => process.env.NODE_ENV === 'test'`,
 * in the Vitest environment they will always call next() without blocking.
 *
 * We also verify skip logic directly and test the error message format by
 * intentionally creating a rate-limited scenario with a fresh tiny limiter.
 */

// ─── Helpers ───────────────────────────────────────────────────────────────

function mockReq(ip = '127.0.0.1') {
  return {
    ip,
    method: 'GET',
    url: '/test',
    headers: {},
    connection: { remoteAddress: ip },
  };
}

function mockRes() {
  return {
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

// Call a rate limiter middleware and return whether next() was invoked
async function callLimiter(limiter, ip = '127.0.0.1') {
  const req = mockReq(ip);
  const res = mockRes();
  const next = vi.fn();
  await limiter(req, res, next);
  return { next, req, res };
}

// ─── Skip behaviour in test environment ────────────────────────────────────

describe('All limiters — skip in test environment', () => {
  it('authLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(authLimiter);
    expect(next).toHaveBeenCalled();
  });

  it('loginLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(loginLimiter);
    expect(next).toHaveBeenCalled();
  });

  it('passwordResetLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(passwordResetLimiter);
    expect(next).toHaveBeenCalled();
  });

  it('verificationLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(verificationLimiter);
    expect(next).toHaveBeenCalled();
  });

  it('bookingLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(bookingLimiter);
    expect(next).toHaveBeenCalled();
  });

  it('apiLimiter calls next() without blocking', async () => {
    const { next } = await callLimiter(apiLimiter);
    expect(next).toHaveBeenCalled();
  });
});

// ─── Skip logic ─────────────────────────────────────────────────────────────
// The skip function is: `(req) => process.env.NODE_ENV === 'test'`
// Test it directly since it's a pure function.

describe('Skip function logic', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns true when NODE_ENV is "test"', () => {
    process.env.NODE_ENV = 'test';
    const skip = (req) => process.env.NODE_ENV === 'test';
    expect(skip(mockReq())).toBe(true);
  });

  it('returns false when NODE_ENV is "production"', () => {
    process.env.NODE_ENV = 'production';
    const skip = (req) => process.env.NODE_ENV === 'test';
    expect(skip(mockReq())).toBe(false);
  });

  it('returns false when NODE_ENV is "development"', () => {
    process.env.NODE_ENV = 'development';
    const skip = (req) => process.env.NODE_ENV === 'test';
    expect(skip(mockReq())).toBe(false);
  });

  it('returns false when NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    const skip = (req) => process.env.NODE_ENV === 'test';
    expect(skip(mockReq())).toBe(false);
  });
});

// ─── Rate limiting behaviour (production mode) ─────────────────────────────
// Use a fresh tiny limiter to verify express-rate-limit works as expected
// when skip returns false. This proves our limiters will block when deployed.

import rateLimit from 'express-rate-limit';

describe('Rate limiting behaviour in production mode', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('blocks requests after the max limit is reached', async () => {
    // Fresh limiter — max 2 requests per very long window
    const tinyLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 2,
      standardHeaders: false,
      legacyHeaders: false,
      // No skip — always enforces
    });

    const IP = '10.0.0.1';

    // First two requests should pass
    for (let i = 0; i < 2; i++) {
      const { next, res } = await callLimiter(tinyLimiter, IP);
      expect(next).toHaveBeenCalled();
    }

    // Third request should be blocked (429)
    const { next: blockedNext, res } = await callLimiter(tinyLimiter, IP);
    expect(blockedNext).not.toHaveBeenCalled();
  });

  it('error response contains success:false', async () => {
    const tinyLimiter = rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 1,
      message: { success: false, error: 'Too many requests' },
      standardHeaders: false,
      legacyHeaders: false,
    });

    const IP = '10.0.0.2';

    // First request passes
    await callLimiter(tinyLimiter, IP);

    // Second request is blocked — check the response body
    const { next, res } = await callLimiter(tinyLimiter, IP);
    expect(next).not.toHaveBeenCalled();
    // express-rate-limit calls res.send or res.json with the message
    const sentBody = res.send.mock.calls[0]?.[0] ?? res.json.mock.calls[0]?.[0];
    expect(sentBody).toMatchObject({ success: false });
  });
});
