import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateToken,
} from '../middleware/validation.js';
import {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  verificationLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
// Validation runs before rate limiting so malformed requests don't eat rate limit budget
router.post('/register', validateEmail, validatePassword, validateRegistration, authLimiter, register);
router.post('/login', validateEmail, loginLimiter, login);
router.post('/verify-email', validateToken, verificationLimiter, verifyEmail);
router.post('/forgot-password', validateEmail, passwordResetLimiter, forgotPassword);
router.post('/reset-password', validateToken, validatePassword, passwordResetLimiter, resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/change-password', protect, validatePassword, changePassword);
router.delete('/account', protect, deleteAccount);

// Logout is intentionally public — the cookie must be clearable even if the token
// has already expired, so protect middleware is not used here.
router.post('/logout', logout);

export default router;
