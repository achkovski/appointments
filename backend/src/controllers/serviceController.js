import crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import db from '../config/database.js';
import { services, businesses } from '../config/schema.js';

// Generate UUID for new records
const generateId = () => crypto.randomUUID();

/**
 * @desc    Create new service for a business
 * @route   POST /api/services
 * @access  Private
 */
export const createService = async (req, res) => {
  try {
    const {
      businessId,
      name,
      description,
      duration,
      price,
      isActive = true,
      displayOrder = 0,
      customCapacity,
    } = req.body;

    // Validation
    if (!businessId || !name || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Business ID, service name, and duration are required',
      });
    }

    // Validate duration is a positive integer
    if (typeof duration !== 'number' || duration < 5 || duration > 480) {
      return res.status(400).json({
        success: false,
        error: 'Service duration must be between 5 and 480 minutes (8 hours)',
      });
    }

    // Validate duration is in increments of 5 minutes
    if (duration % 5 !== 0) {
      return res.status(400).json({
        success: false,
        error: 'Service duration must be in 5-minute increments',
      });
    }

    // Validate customCapacity if provided
    if (customCapacity !== undefined && customCapacity !== null) {
      if (typeof customCapacity !== 'number' || !Number.isInteger(customCapacity) || customCapacity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Custom capacity must be a positive integer',
        });
      }
    }

    // Check if business exists and belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found or unauthorized',
      });
    }

    // Create service
    const now = new Date().toISOString();
    const [newService] = await db.insert(services).values({
      id: generateId(),
      businessId,
      name,
      description: description || null,
      duration,
      price: price || null,
      isActive,
      displayOrder,
      customCapacity: customCapacity ?? null,
      updatedAt: now,
    }).returning();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: newService,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating service',
      message: error.message,
    });
  }
};

/**
 * @desc    Get all services for a business
 * @route   GET /api/services/business/:businessId
 * @access  Private
 */
export const getServicesByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    // Check if business exists and belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found or unauthorized',
      });
    }

    // Get all services for business
    const businessServices = await db.query.services.findMany({
      where: eq(services.businessId, businessId),
      orderBy: (services, { asc }) => [asc(services.displayOrder), asc(services.name)],
    });

    res.status(200).json({
      success: true,
      count: businessServices.length,
      services: businessServices,
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching services',
      message: error.message,
    });
  }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Private
 */
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get service with business info
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, service.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this service',
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching service',
      message: error.message,
    });
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private
 */
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration,
      price,
      isActive,
      displayOrder,
      customCapacity,
    } = req.body;

    // Get service
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingService.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this service',
      });
    }

    // Validate duration if provided
    if (duration !== undefined) {
      if (typeof duration !== 'number' || duration < 5 || duration > 480) {
        return res.status(400).json({
          success: false,
          error: 'Service duration must be between 5 and 480 minutes (8 hours)',
        });
      }

      if (duration % 5 !== 0) {
        return res.status(400).json({
          success: false,
          error: 'Service duration must be in 5-minute increments',
        });
      }
    }

    // Validate customCapacity if provided
    if (customCapacity !== undefined && customCapacity !== null) {
      if (typeof customCapacity !== 'number' || !Number.isInteger(customCapacity) || customCapacity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Custom capacity must be a positive integer',
        });
      }
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (duration !== undefined) updateData.duration = duration;
    if (price !== undefined) updateData.price = price || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (customCapacity !== undefined) updateData.customCapacity = customCapacity;

    // Update service
    const [updatedService] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating service',
      message: error.message,
    });
  }
};

/**
 * @desc    Toggle service active/inactive status
 * @route   PUT /api/services/:id/toggle
 * @access  Private
 */
export const toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get service
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingService.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this service',
      });
    }

    // Toggle isActive status
    const [updatedService] = await db
      .update(services)
      .set({
        isActive: !existingService.isActive,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning();

    res.status(200).json({
      success: true,
      message: `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`,
      service: updatedService,
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error toggling service status',
      message: error.message,
    });
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private
 */
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Get service
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, id),
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, existingService.businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this service',
      });
    }

    // Delete service
    await db.delete(services).where(eq(services.id, id));

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting service',
      message: error.message,
    });
  }
};

/**
 * @desc    Reorder services
 * @route   PUT /api/services/business/:businessId/reorder
 * @access  Private
 */
export const reorderServices = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { serviceOrder } = req.body; // Array of { id, displayOrder }

    if (!Array.isArray(serviceOrder)) {
      return res.status(400).json({
        success: false,
        error: 'Service order must be an array',
      });
    }

    // Check if business belongs to user
    const business = await db.query.businesses.findFirst({
      where: and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, req.user.id)
      ),
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found or unauthorized',
      });
    }

    // Update display order for each service
    const updatePromises = serviceOrder.map(({ id, displayOrder }) =>
      db.update(services)
        .set({ displayOrder, updatedAt: new Date() })
        .where(and(
          eq(services.id, id),
          eq(services.businessId, businessId)
        ))
    );

    await Promise.all(updatePromises);

    // Get updated services
    const updatedServices = await db.query.services.findMany({
      where: eq(services.businessId, businessId),
      orderBy: (services, { asc }) => [asc(services.displayOrder)],
    });

    res.status(200).json({
      success: true,
      message: 'Services reordered successfully',
      services: updatedServices,
    });
  } catch (error) {
    console.error('Reorder services error:', error);
    res.status(500).json({
      success: false,
      error: 'Error reordering services',
      message: error.message,
    });
  }
};

export default {
  createService,
  getServicesByBusiness,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService,
  reorderServices,
};
