import { eq } from 'drizzle-orm';
import { verifyJWT } from '../utils/tokenGenerator.js';
import db from '../config/database.js';
import { users } from '../config/schema.js';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (req, res, next) => {
  try {
    // Read token from httpOnly cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }

    // Verify token
    const decoded = verifyJWT(token);

    // Get user from database (excluding password)
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
      columns: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
      message: error.message,
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    next();
  };
};
