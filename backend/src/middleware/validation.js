/**
 * Validation middleware for request data
 */

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required',
    });
  }

  // RFC 5322 compliant email regex (simplified version)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid email address',
    });
  }

  // Normalize email to lowercase
  req.body.email = email.toLowerCase().trim();
  next();
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordToValidate = password || newPassword;

  if (!passwordToValidate) {
    return res.status(400).json({
      success: false,
      error: 'Password is required',
    });
  }

  // Check minimum length
  if (passwordToValidate.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long',
    });
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(passwordToValidate)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain at least one uppercase letter',
    });
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(passwordToValidate)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain at least one lowercase letter',
    });
  }

  // Check for number
  if (!/\d/.test(passwordToValidate)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain at least one number',
    });
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordToValidate)) {
    return res.status(400).json({
      success: false,
      error: 'Password must contain at least one special character (!@#$%^&*...)',
    });
  }

  next();
};

/**
 * Validate registration data
 */
export const validateRegistration = (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  // Validate first name
  if (!firstName || firstName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'First name must be at least 2 characters long',
    });
  }

  // Validate last name
  if (!lastName || lastName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Last name must be at least 2 characters long',
    });
  }

  // Validate phone (optional but must be valid if provided)
  if (phone && phone.trim().length > 0) {
    // Basic phone validation (supports international formats)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid phone number (minimum 10 digits)',
      });
    }
  }

  // Normalize names
  req.body.firstName = firstName.trim();
  req.body.lastName = lastName.trim();
  if (phone) {
    req.body.phone = phone.trim();
  }

  next();
};

/**
 * Validate token
 */
export const validateToken = (req, res, next) => {
  const { token } = req.body;

  if (!token || token.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Token is required',
    });
  }

  next();
};

/**
 * Validate availability (working hours) data
 */
export const validateAvailability = (req, res, next) => {
  const { dayOfWeek, startTime, endTime } = req.body;

  // Validate dayOfWeek (required for creation)
  if (req.method === 'POST') {
    if (dayOfWeek === undefined || dayOfWeek === null) {
      return res.status(400).json({
        success: false,
        error: 'dayOfWeek is required',
      });
    }

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        error: 'dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)',
      });
    }
  }

  // Validate startTime (required for creation)
  if (req.method === 'POST' && !startTime) {
    return res.status(400).json({
      success: false,
      error: 'startTime is required',
    });
  }

  // Validate endTime (required for creation)
  if (req.method === 'POST' && !endTime) {
    return res.status(400).json({
      success: false,
      error: 'endTime is required',
    });
  }

  // Validate time format if provided
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

  if (startTime && !timeRegex.test(startTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid startTime format. Use HH:MM or HH:MM:SS',
    });
  }

  if (endTime && !timeRegex.test(endTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid endTime format. Use HH:MM or HH:MM:SS',
    });
  }

  // Validate startTime < endTime if both are provided
  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json({
      success: false,
      error: 'startTime must be before endTime',
    });
  }

  next();
};

/**
 * Validate break data
 */
export const validateBreak = (req, res, next) => {
  const { breakStart, breakEnd } = req.body;

  // Validate breakStart (required for creation)
  if (req.method === 'POST' && !breakStart) {
    return res.status(400).json({
      success: false,
      error: 'breakStart is required',
    });
  }

  // Validate breakEnd (required for creation)
  if (req.method === 'POST' && !breakEnd) {
    return res.status(400).json({
      success: false,
      error: 'breakEnd is required',
    });
  }

  // Validate time format if provided
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

  if (breakStart && !timeRegex.test(breakStart)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid breakStart format. Use HH:MM or HH:MM:SS',
    });
  }

  if (breakEnd && !timeRegex.test(breakEnd)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid breakEnd format. Use HH:MM or HH:MM:SS',
    });
  }

  // Validate breakStart < breakEnd if both are provided
  if (breakStart && breakEnd && breakStart >= breakEnd) {
    return res.status(400).json({
      success: false,
      error: 'breakStart must be before breakEnd',
    });
  }

  next();
};

/**
 * Validate special date data
 */
export const validateSpecialDate = (req, res, next) => {
  const { date, startTime, endTime } = req.body;

  // Validate date (required for creation)
  if (req.method === 'POST' && !date) {
    return res.status(400).json({
      success: false,
      error: 'date is required',
    });
  }

  // Validate date format (YYYY-MM-DD) if provided
  if (date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Validate it's a valid date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date value',
      });
    }
  }

  // Validate time format if provided
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

  if (startTime && startTime !== null && !timeRegex.test(startTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid startTime format. Use HH:MM or HH:MM:SS',
    });
  }

  if (endTime && endTime !== null && !timeRegex.test(endTime)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid endTime format. Use HH:MM or HH:MM:SS',
    });
  }

  // Validate startTime < endTime if both are provided
  if (startTime && endTime && startTime >= endTime) {
    return res.status(400).json({
      success: false,
      error: 'startTime must be before endTime',
    });
  }

  next();
};

export default {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateToken,
  validateAvailability,
  validateBreak,
  validateSpecialDate,
};
