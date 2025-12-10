import db from '../config/database.js';
import { appointments, businesses, services } from '../config/schema.js';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { calculateAvailableSlots } from '../services/slotCalculator.js';
import { sendAppointmentConfirmationEmail } from '../services/emailService.js';
import crypto from 'crypto';

/**
 * APPOINTMENT CONTROLLER
 * Handles appointment booking and management
 */

/**
 * Create a new appointment (guest booking - public endpoint)
 * POST /api/public/book
 * Body: {
 *   businessSlug, serviceId, appointmentDate, startTime,
 *   clientFirstName, clientLastName, clientEmail, clientPhone, clientNotes
 * }
 */
export const createGuestAppointment = async (req, res) => {
  try {
    const {
      businessSlug,
      serviceId,
      appointmentDate,
      startTime,
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      clientNotes
    } = req.body;

    // Validate required fields
    if (!businessSlug || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'businessSlug, serviceId, appointmentDate, and startTime are required'
      });
    }

    if (!clientFirstName || !clientLastName || !clientEmail || !clientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Client information (firstName, lastName, email, phone) is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get business by slug
    const business = await db.select().from(businesses)
      .where(eq(businesses.slug, businessSlug))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessData = business[0];

    // Get service and verify it belongs to this business
    const service = await db.select().from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.businessId, businessData.id),
        eq(services.isActive, true)
      ))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    const serviceData = service[0];

    // Calculate available slots for the requested date
    const slotsData = await calculateAvailableSlots(businessData.id, serviceId, appointmentDate);

    if (!slotsData.available) {
      return res.status(400).json({
        success: false,
        message: `No slots available on ${appointmentDate}`,
        reason: slotsData.reason
      });
    }

    // Verify the requested time slot is available
    const requestedSlot = slotsData.slots.find(slot => slot.startTime === startTime);

    if (!requestedSlot) {
      return res.status(400).json({
        success: false,
        message: `Time slot ${startTime} is not available`,
        availableSlots: slotsData.slots
      });
    }

    // Calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + serviceData.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Determine initial status
    const initialStatus = businessData.autoConfirm ? 'CONFIRMED' : 'PENDING';

    // Generate email confirmation token if required
    let emailConfirmationToken = null;
    if (businessData.requireEmailConfirmation) {
      emailConfirmationToken = crypto.randomBytes(32).toString('hex');
    }

    // Create appointment
    const newAppointment = {
      id: randomUUID(),
      businessId: businessData.id,
      serviceId: serviceData.id,
      clientUserId: null, // Guest booking
      clientFirstName,
      clientLastName,
      clientEmail: clientEmail.toLowerCase().trim(),
      clientPhone,
      appointmentDate,
      startTime,
      endTime,
      status: businessData.requireEmailConfirmation ? 'PENDING' : initialStatus,
      isEmailConfirmed: !businessData.requireEmailConfirmation,
      emailConfirmationToken: businessData.requireEmailConfirmation
        ? crypto.createHash('sha256').update(emailConfirmationToken).digest('hex')
        : null,
      notes: null,
      clientNotes: clientNotes || null,
      cancellationReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(appointments).values(newAppointment);

    // Send confirmation email
    try {
      await sendAppointmentConfirmationEmail({
        to: clientEmail,
        clientName: `${clientFirstName} ${clientLastName}`,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime,
        endTime,
        requiresConfirmation: businessData.requireEmailConfirmation,
        confirmationToken: emailConfirmationToken
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    // Prepare response
    const response = {
      success: true,
      message: businessData.requireEmailConfirmation
        ? 'Appointment created! Please check your email to confirm.'
        : businessData.autoConfirm
          ? 'Appointment confirmed!'
          : 'Appointment request submitted. You will receive confirmation soon.',
      appointment: {
        id: newAppointment.id,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime,
        endTime,
        status: newAppointment.status,
        requiresEmailConfirmation: businessData.requireEmailConfirmation
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Confirm appointment via email token
 * POST /api/public/confirm-appointment
 * Body: { token }
 */
export const confirmAppointmentEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token is required'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find appointment with this token
    const appointment = await db.select().from(appointments)
      .where(eq(appointments.emailConfirmationToken, hashedToken))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired confirmation token'
      });
    }

    const apt = appointment[0];

    // Check if already confirmed
    if (apt.isEmailConfirmed) {
      return res.status(400).json({
        success: false,
        message: 'Appointment already confirmed'
      });
    }

    // Update appointment status
    await db.update(appointments)
      .set({
        isEmailConfirmed: true,
        status: 'CONFIRMED',
        emailConfirmationToken: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, apt.id));

    res.json({
      success: true,
      message: 'Appointment confirmed successfully!'
    });

  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all appointments for a business (business owner only)
 * GET /api/appointments/business/:businessId
 * Query: ?status=PENDING&date=YYYY-MM-DD&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getBusinessAppointments = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { status, date, startDate, endDate } = req.query;
    const userId = req.user.id;

    // Verify business ownership
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this business.'
      });
    }

    // Build query with filters
    let conditions = [eq(appointments.businessId, businessId)];

    if (status) {
      conditions.push(eq(appointments.status, status));
    }

    if (date) {
      conditions.push(eq(appointments.appointmentDate, date));
    } else if (startDate && endDate) {
      conditions.push(gte(appointments.appointmentDate, startDate));
      conditions.push(lte(appointments.appointmentDate, endDate));
    } else if (startDate) {
      conditions.push(gte(appointments.appointmentDate, startDate));
    }

    const appointmentsList = await db.select().from(appointments)
      .where(and(...conditions))
      .orderBy(appointments.appointmentDate, appointments.startTime);

    res.json({
      success: true,
      data: appointmentsList,
      total: appointmentsList.length
    });

  } catch (error) {
    console.error('Get business appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single appointment details (business owner only)
 * GET /api/appointments/:appointmentId
 */
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Get appointment with service info
    const appointment = await db.select({
      appointment: appointments,
      service: services,
      business: businesses
    })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { appointment: apt, service, business } = appointment[0];

    // Verify business ownership
    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this business.'
      });
    }

    res.json({
      success: true,
      data: {
        ...apt,
        serviceName: service?.name,
        serviceDuration: service?.duration,
        servicePrice: service?.price,
        businessName: business?.businessName
      }
    });

  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update appointment status (business owner only)
 * PUT /api/appointments/:appointmentId/status
 * Body: { status, cancellationReason }
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, cancellationReason } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get appointment
    const appointment = await db.select().from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify business ownership
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, appointment[0].businessId))
      .limit(1);

    if (!business.length || business[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this business.'
      });
    }

    // Update appointment
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'CANCELLED' && cancellationReason) {
      updates.cancellationReason = cancellationReason;
    }

    await db.update(appointments)
      .set(updates)
      .where(eq(appointments.id, appointmentId));

    res.json({
      success: true,
      message: `Appointment status updated to ${status}`
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update appointment notes (business owner only)
 * PUT /api/appointments/:appointmentId/notes
 * Body: { notes }
 */
export const updateAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Get appointment
    const appointment = await db.select().from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify business ownership
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, appointment[0].businessId))
      .limit(1);

    if (!business.length || business[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this business.'
      });
    }

    // Update notes
    await db.update(appointments)
      .set({
        notes: notes || null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointmentId));

    res.json({
      success: true,
      message: 'Appointment notes updated successfully'
    });

  } catch (error) {
    console.error('Update appointment notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment notes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reschedule appointment (business owner only)
 * PUT /api/appointments/:appointmentId/reschedule
 * Body: { appointmentDate, startTime, serviceId }
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, startTime, serviceId } = req.body;
    const userId = req.user.id;

    if (!appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'appointmentDate and startTime are required'
      });
    }

    // Get appointment
    const appointment = await db.select().from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const apt = appointment[0];

    // Verify business ownership
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, apt.businessId))
      .limit(1);

    if (!business.length || business[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this business.'
      });
    }

    // Get service (use existing or new serviceId)
    const targetServiceId = serviceId || apt.serviceId;
    const service = await db.select().from(services)
      .where(eq(services.id, targetServiceId))
      .limit(1);

    if (!service.length) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const serviceData = service[0];

    // Calculate available slots for the new date
    const slotsData = await calculateAvailableSlots(
      apt.businessId,
      targetServiceId,
      appointmentDate,
      appointmentId // Exclude current appointment from availability check
    );

    if (!slotsData.available) {
      return res.status(400).json({
        success: false,
        message: `No slots available on ${appointmentDate}`,
        reason: slotsData.reason
      });
    }

    // Verify the requested time slot is available
    const requestedSlot = slotsData.slots.find(slot => slot.startTime === startTime);

    if (!requestedSlot) {
      return res.status(400).json({
        success: false,
        message: `Time slot ${startTime} is not available`,
        availableSlots: slotsData.slots
      });
    }

    // Calculate new end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + serviceData.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Update appointment
    await db.update(appointments)
      .set({
        appointmentDate,
        startTime,
        endTime,
        serviceId: targetServiceId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointmentId));

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentDate,
        startTime,
        endTime
      }
    });

  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createGuestAppointment,
  confirmAppointmentEmail,
  getBusinessAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment
};
