import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import db from '../config/database.js';
import { users, businesses } from '../config/schema.js';
import { generateJWT, generateRandomToken, hashToken } from '../utils/tokenGenerator.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';

// Generate UUID for new records
const generateId = () => crypto.randomUUID();

/**
 * @desc    Register a new business user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, first name, and last name',
      });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = generateRandomToken();
    const hashedToken = hashToken(verificationToken);

    // Create user
    const now = new Date().toISOString();
    const [newUser] = await db.insert(users).values({
      id: generateId(),
      email,
      passwordHash,
      firstName,
      lastName,
      phone: phone || null,
      role: 'BUSINESS',
      emailVerificationToken: hashedToken,
      updatedAt: now,
    }).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      emailVerified: users.emailVerified,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate JWT
    const token = generateJWT(newUser.id, newUser.email, newUser.role);

    const response = {
      success: true,
      message: 'User registered successfully. Please verify your email.',
      token,
      user: newUser,
    };

    // Include verification token only in development
    if (process.env.NODE_ENV !== 'production') {
      response.verificationToken = verificationToken;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Error registering user',
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    // Find user with password
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = generateJWT(user.id, user.email, user.role);

    // Fetch user's business if they have one
    let businessId = null;
    if (user.hasCompletedSetup) {
      const business = await db.select({ id: businesses.id })
        .from(businesses)
        .where(eq(businesses.ownerId, user.id))
        .limit(1);

      if (business.length > 0) {
        businessId = business[0].id;
      }
    }

    // Return user without sensitive fields
    const {
      passwordHash,
      emailVerificationToken,
      resetPasswordToken,
      resetPasswordExpires,
      ...userWithoutPassword
    } = user;

    res.status(200).json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        businessId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again later.',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        emailVerified: true,
        hasCompletedSetup: true,
        settings: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching user',
    });
  }
};

/**
 * @desc    Verify email address
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Please provide verification token',
      });
    }

    // Hash the provided token to match with database
    const hashedToken = hashToken(token);

    // First, check if user exists with this token (regardless of verification status)
    const userWithToken = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, hashedToken),
    });

    // If user with token exists and is already verified
    if (userWithToken && userWithToken.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email address has already been verified',
        alreadyVerified: true,
      });
    }

    // Find user with this token who hasn't verified yet
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.emailVerificationToken, hashedToken),
        eq(users.emailVerified, false)
      ),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token',
      });
    }

    // Update user to verified and clear the token
    // Only proceed if we actually updated a row (prevents race conditions)
    const updateResult = await db.update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, user.id),
        eq(users.emailVerified, false),
        eq(users.emailVerificationToken, hashedToken)
      ))
      .returning({ id: users.id });

    // Only send welcome email if we actually performed the update
    // This prevents duplicate emails if the endpoint is called multiple times
    if (updateResult.length > 0) {
      try {
        await sendWelcomeEmail(user.email, user.firstName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the verification if welcome email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying email',
    });
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email address',
      });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const hashedToken = hashToken(resetToken);

    // Set token and expiry (1 hour from now)
    await db.update(users)
      .set({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't reveal email sending errors to user for security
    }

    const response = {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    };

    // Include reset token only in development
    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing password reset request',
    });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide reset token and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Hash the provided token
    const hashedToken = hashToken(token);

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.resetPasswordToken, hashedToken),
        gt(users.resetPasswordExpires, new Date())
      ),
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await db.update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Error resetting password',
    });
  }
};

/**
 * @desc    Logout user (client-side should remove token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
