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
router.post('/register', authLimiter, validateEmail, validatePassword, validateRegistration, register);
router.post('/login', loginLimiter, validateEmail, login);
router.post('/verify-email', verificationLimiter, validateToken, verifyEmail);
router.post('/forgot-password', passwordResetLimiter, validateEmail, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateToken, validatePassword, resetPassword);

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/change-password', protect, validatePassword, changePassword);

// Logout is intentionally public — the cookie must be clearable even if the token
// has already expired, so protect middleware is not used here.
router.post('/logout', logout);

export default router;
