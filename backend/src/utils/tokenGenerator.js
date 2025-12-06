import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate JWT token for user authentication
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} JWT token
 */
export const generateJWT = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate random token for email verification or password reset
 * @returns {string} Random token (hex)
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
