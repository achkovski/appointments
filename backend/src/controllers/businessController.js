import crypto from 'crypto';
import slugify from 'slugify';
import QRCode from 'qrcode';
import { eq, and, ne } from 'drizzle-orm';
import db from '../config/database.js';
import { businesses, services, users } from '../config/schema.js';

// Generate UUID for new records
const generateId = () => crypto.randomUUID();

/**
 * Generate unique slug for business
 * @param {string} businessName - Business name
 * @returns {Promise<string>} - Unique slug
 */
const generateUniqueSlug = async (businessName, excludeId = null) => {
  const baseSlug = slugify(businessName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  let slug = baseSlug;
  let counter = 1;

  // Check if slug exists
  while (true) {
    const conditions = excludeId
      ? and(eq(businesses.slug, slug), ne(businesses.id, excludeId))
      : eq(businesses.slug, slug);

    const existing = await db.query.businesses.findFirst({
      where: conditions,
    });

    if (!existing) {
      break;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Generate QR code for business booking page
 * @param {string} slug - Business slug
 * @returns {Promise<string>} - QR code data URL
 */
const generateQRCode = async (slug) => {
  const bookingUrl = `${process.env.CLIENT_URL}/book/${slug}`;

  try {
    const qrCodeDataURL = await QRCode.toDataURL(bookingUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 400,
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * @desc    Create new business
 * @route   POST /api/businesses
 * @access  Private (Business users only)
 */
export const createBusiness = async (req, res) => {
  try {
    const {
      businessName,
      description,
      address,
      phone,
      email,
      website,
      businessType,
      capacityMode = 'SINGLE',
      defaultCapacity = 1,
      defaultSlotInterval = 15,
      autoConfirm = true,
      requireEmailConfirmation = false,
      settings = {},
    } = req.body;

    // Validation
    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required',
      });
    }

    // Check if user already has a business with this name
    const existingBusiness = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.ownerId, req.user.id),
        eq(businesses.businessName, businessName)
      ),
    });

    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        error: 'You already have a business with this name',
      });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(businessName);

    // Generate QR code
    const qrCodeUrl = await generateQRCode(slug);

    // Create business
    const now = new Date().toISOString();
    const normalizedCapacityMode = capacityMode.toUpperCase();
    const [newBusiness] = await db.insert(businesses).values({
      id: generateId(),
      ownerId: req.user.id,
      businessName,
      slug,
      description: description || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      businessType: businessType || null,
      qrCodeUrl,
      capacityMode: normalizedCapacityMode,
      defaultCapacity: normalizedCapacityMode === 'MULTIPLE' ? defaultCapacity : 1,
      defaultSlotInterval,
      autoConfirm,
      requireEmailConfirmation,
      settings,
      updatedAt: now,
    }).returning();

    // Update user's hasCompletedSetup flag
    await db.update(users)
      .set({ hasCompletedSetup: true, updatedAt: now })
      .where(eq(users.id, req.user.id));

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      business: newBusiness,
      bookingUrl: `${process.env.CLIENT_URL}/book/${slug}`,
    });
  } catch (error) {
    console.error('Create business error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating business',
      message: error.message,
    });
  }
};

/**
 * @desc    Get all businesses for current user
 * @route   GET /api/businesses
 * @access  Private
 */
export const getBusinesses = async (req, res) => {
  try {
    const userBusinesses = await db.query.businesses.findMany({
      where: eq(businesses.ownerId, req.user.id),
      orderBy: (businesses, { desc }) => [desc(businesses.createdAt)],
    });

    res.status(200).json({
      success: true,
      count: userBusinesses.length,
      businesses: userBusinesses,
    });
  } catch (error) {
    console.error('Get businesses error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching businesses',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single business by ID
 * @route   GET /api/businesses/:id
 * @access  Private
 */
export const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, id),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    res.status(200).json({
      success: true,
      business,
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching business',
      message: error.message,
    });
  }
};

/**
 * @desc    Get business by slug (public)
 * @route   GET /api/businesses/slug/:slug
 * @access  Public
 */
export const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.slug, slug),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    // Get business services
    const businessServices = await db.query.services.findMany({
      where: and(
        eq(services.businessId, business.id),
        eq(services.isActive, true)
      ),
      orderBy: (services, { asc }) => [asc(services.displayOrder), asc(services.name)],
    });

    res.status(200).json({
      success: true,
      business,
      services: businessServices,
    });
  } catch (error) {
    console.error('Get business by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching business',
      message: error.message,
    });
  }
};

/**
 * @desc    Update business
 * @route   PUT /api/businesses/:id
 * @access  Private
 */
export const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      businessName,
      description,
      address,
      phone,
      email,
      website,
      businessType,
      capacityMode,
      defaultCapacity,
      defaultSlotInterval,
      autoConfirm,
      requireEmailConfirmation,
      settings,
    } = req.body;

    // Check if business exists and belongs to user
    const existingBusiness = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, id),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!existingBusiness) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (businessName !== undefined && businessName !== existingBusiness.businessName) {
      // Generate new slug if business name changed
      updateData.slug = await generateUniqueSlug(businessName, id);
      updateData.businessName = businessName;

      // Regenerate QR code with new slug
      updateData.qrCodeUrl = await generateQRCode(updateData.slug);
    }

    if (description !== undefined) updateData.description = description || null;
    if (address !== undefined) updateData.address = address || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (website !== undefined) updateData.website = website || null;
    if (businessType !== undefined) updateData.businessType = businessType || null;
    if (capacityMode !== undefined) updateData.capacityMode = capacityMode;
    if (defaultCapacity !== undefined) updateData.defaultCapacity = defaultCapacity;
    if (defaultSlotInterval !== undefined) updateData.defaultSlotInterval = defaultSlotInterval;
    if (autoConfirm !== undefined) updateData.autoConfirm = autoConfirm;
    if (requireEmailConfirmation !== undefined) updateData.requireEmailConfirmation = requireEmailConfirmation;
    if (settings !== undefined) updateData.settings = settings;

    // Update business
    const [updatedBusiness] = await db
      .update(businesses)
      .set(updateData)
      .where(eq(businesses.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      business: updatedBusiness,
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating business',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete business
 * @route   DELETE /api/businesses/:id
 * @access  Private
 */
export const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if business exists and belongs to user
    const existingBusiness = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, id),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!existingBusiness) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    // Delete business (cascade will delete related records)
    await db.delete(businesses).where(eq(businesses.id, id));

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
    });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting business',
      message: error.message,
    });
  }
};

/**
 * @desc    Regenerate QR code for business
 * @route   POST /api/businesses/:id/regenerate-qr
 * @access  Private
 */
export const regenerateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if business exists and belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, id),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    // Generate new QR code
    const qrCodeUrl = await generateQRCode(business.slug);

    // Update business with new QR code
    const [updatedBusiness] = await db
      .update(businesses)
      .set({
        qrCodeUrl,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: 'QR code regenerated successfully',
      qrCodeUrl: updatedBusiness.qrCodeUrl,
    });
  } catch (error) {
    console.error('Regenerate QR code error:', error);
    res.status(500).json({
      success: false,
      error: 'Error regenerating QR code',
      message: error.message,
    });
  }
};

export default {
  createBusiness,
  getBusinesses,
  getBusinessById,
  getBusinessBySlug,
  updateBusiness,
  deleteBusiness,
  regenerateQRCode,
};
