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

export default {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateToken,
};
