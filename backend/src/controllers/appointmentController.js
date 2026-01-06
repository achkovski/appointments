import db from '../config/database.js';
import { appointments, businesses, services, users, employees, employeeServices } from '../config/schema.js';
import { eq, and, gte, lte, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { calculateAvailableSlots } from '../services/slotCalculator.js';
import {
  sendAppointmentConfirmationEmail,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendBusinessAlertEmail
} from '../services/emailService.js';
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
      clientNotes,
      employeeId
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
    const settings = businessData.settings || {};

    // Validate booking settings
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);

    // Check minimum booking notice (in hours)
    const minBookingNotice = settings.minBookingNotice ?? 2; // default 2 hours
    if (minBookingNotice > 0) {
      const minNoticeMs = minBookingNotice * 60 * 60 * 1000;
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      if (timeDiff < minNoticeMs) {
        return res.status(400).json({
          success: false,
          message: `Appointments must be booked at least ${minBookingNotice} hour${minBookingNotice > 1 ? 's' : ''} in advance`
        });
      }
    }

    // Check maximum advance booking (in days)
    const maxAdvanceBooking = settings.maxAdvanceBooking ?? 30; // default 30 days
    if (maxAdvanceBooking > 0) {
      const maxAdvanceMs = maxAdvanceBooking * 24 * 60 * 60 * 1000;
      const timeDiff = appointmentDateTime.getTime() - now.getTime();
      if (timeDiff > maxAdvanceMs) {
        return res.status(400).json({
          success: false,
          message: `Appointments cannot be booked more than ${maxAdvanceBooking} days in advance`
        });
      }
    }

    // Check max appointments per day (0 = unlimited)
    const maxAppointmentsPerDay = settings.maxAppointmentsPerDay ?? 0;
    if (maxAppointmentsPerDay > 0) {
      const existingAppointmentsForDay = await db.select().from(appointments)
        .where(and(
          eq(appointments.businessId, businessData.id),
          eq(appointments.appointmentDate, appointmentDate)
        ));

      const activeAppointments = existingAppointmentsForDay.filter(
        apt => apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW'
      );

      if (activeAppointments.length >= maxAppointmentsPerDay) {
        return res.status(400).json({
          success: false,
          message: `Maximum appointments for ${appointmentDate} has been reached. Please select another date.`
        });
      }
    }

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

    // Validate employee if specified
    let employeeData = null;
    if (employeeId) {
      const employee = await db.select().from(employees)
        .where(and(
          eq(employees.id, employeeId),
          eq(employees.businessId, businessData.id),
          eq(employees.isActive, true)
        ))
        .limit(1);

      if (!employee.length) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found or inactive'
        });
      }

      employeeData = employee[0];

      // Verify employee is assigned to this service
      const assignment = await db.select().from(employeeServices)
        .where(and(
          eq(employeeServices.employeeId, employeeId),
          eq(employeeServices.serviceId, serviceId)
        ))
        .limit(1);

      if (!assignment.length) {
        return res.status(400).json({
          success: false,
          message: 'Selected employee is not assigned to this service'
        });
      }
    }

    // Calculate available slots for the requested date
    // Allow past slots for business users (they can add appointments made by phone)
    const options = employeeId ? { employeeId } : {};
    const slotsData = await calculateAvailableSlots(businessData.id, serviceId, appointmentDate, null, true, options);

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

    // Get booking settings from JSON settings field
    const requireEmailConfirmation = settings.requireEmailConfirmation ?? businessData.requireEmailConfirmation ?? false;
    const autoConfirm = settings.autoConfirm ?? businessData.autoConfirm ?? true;

    // Determine initial status based on requireEmailConfirmation and autoConfirm
    // Flow:
    // 1. If requireEmailConfirmation is TRUE → client must verify email first, status = PENDING
    // 2. After email verification (or if not required):
    //    - If autoConfirm is TRUE → status = CONFIRMED
    //    - If autoConfirm is FALSE → status = PENDING (needs manual business approval)
    let initialStatus;
    let emailConfirmationToken = null;

    if (requireEmailConfirmation) {
      // Email confirmation required = needs verification first
      initialStatus = 'PENDING';
      emailConfirmationToken = crypto.randomBytes(32).toString('hex');
    } else if (autoConfirm) {
      // No email confirmation required + auto-confirm enabled = instant confirmation
      initialStatus = 'CONFIRMED';
    } else {
      // No email confirmation required but auto-confirm disabled = needs manual approval
      initialStatus = 'PENDING';
    }

    // Create appointment
    const newAppointment = {
      id: randomUUID(),
      businessId: businessData.id,
      serviceId: serviceData.id,
      employeeId: employeeId || null,
      clientUserId: null, // Guest booking
      clientFirstName,
      clientLastName,
      clientEmail: clientEmail.toLowerCase().trim(),
      clientPhone,
      appointmentDate,
      startTime,
      endTime,
      status: initialStatus,
      isEmailConfirmed: !requireEmailConfirmation,
      emailConfirmationToken: emailConfirmationToken
        ? crypto.createHash('sha256').update(emailConfirmationToken).digest('hex')
        : null,
      notes: null,
      clientNotes: clientNotes || null,
      cancellationReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(appointments).values(newAppointment);

    // Send confirmation email to client
    try {
      await sendAppointmentConfirmationEmail({
        to: clientEmail,
        clientName: `${clientFirstName} ${clientLastName}`,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime,
        endTime,
        requiresConfirmation: requireEmailConfirmation,
        confirmationToken: emailConfirmationToken,
        businessAddress: businessData.address,
        businessPhone: businessData.phone,
        businessEmail: businessData.email
      });
    } catch (emailError) {
      console.error('Client confirmation email failed:', emailError);
      // Don't fail the booking if email fails
    }

    // Send alert email to business owner
    try {
      // Get business owner email
      const owner = await db.select().from(users)
        .where(eq(users.id, businessData.ownerId))
        .limit(1);

      if (owner.length && owner[0].email) {
        await sendBusinessAlertEmail({
          to: owner[0].email,
          businessName: businessData.businessName,
          clientName: `${clientFirstName} ${clientLastName}`,
          clientPhone,
          serviceName: serviceData.name,
          appointmentDate,
          startTime,
          endTime
        });
      }
    } catch (emailError) {
      console.error('Business alert email failed:', emailError);
      // Don't fail the booking if email fails
    }

    // Prepare response message based on status
    let responseMessage;
    if (requireEmailConfirmation) {
      responseMessage = 'Appointment created! Please check your email to confirm.';
    } else if (autoConfirm) {
      responseMessage = 'Appointment confirmed!';
    } else {
      responseMessage = 'Appointment created! Awaiting business confirmation.';
    }

    // Prepare response
    const response = {
      success: true,
      message: responseMessage,
      appointment: {
        id: newAppointment.id,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime,
        endTime,
        status: newAppointment.status,
        requiresEmailConfirmation: requireEmailConfirmation
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

    // Get business settings to check autoConfirm
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, apt.businessId))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessData = business[0];
    const settings = businessData.settings || {};

    // Check autoConfirm setting from settings JSON (fallback to column, then default true)
    const autoConfirm = settings.autoConfirm ?? businessData.autoConfirm ?? true;

    // After email confirmation:
    // - If autoConfirm is TRUE → status becomes CONFIRMED
    // - If autoConfirm is FALSE → status stays PENDING (needs manual business approval)
    const newStatus = autoConfirm ? 'CONFIRMED' : 'PENDING';
    const requiresBusinessApproval = !autoConfirm;

    // Update appointment status
    await db.update(appointments)
      .set({
        isEmailConfirmed: true,
        status: newStatus,
        emailConfirmationToken: null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, apt.id));

    // Get service information for response
    const service = await db.select().from(services)
      .where(eq(services.id, apt.serviceId))
      .limit(1);

    // Format appointment details for frontend
    const appointmentDetails = {
      status: newStatus,
      requiresBusinessApproval,
      serviceName: service.length > 0 ? service[0].name : null,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      businessName: businessData.businessName,
      businessSlug: businessData.slug
    };

    res.json({
      success: true,
      message: autoConfirm
        ? 'Email verified! Your appointment is now confirmed.'
        : 'Email verified! Your appointment is pending business confirmation.',
      data: appointmentDetails
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

    // Fetch appointments with service and employee information
    const appointmentsList = await db.select({
      id: appointments.id,
      businessId: appointments.businessId,
      serviceId: appointments.serviceId,
      employeeId: appointments.employeeId,
      clientUserId: appointments.clientUserId,
      clientFirstName: appointments.clientFirstName,
      clientLastName: appointments.clientLastName,
      clientEmail: appointments.clientEmail,
      clientPhone: appointments.clientPhone,
      appointmentDate: appointments.appointmentDate,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      isEmailConfirmed: appointments.isEmailConfirmed,
      notes: appointments.notes,
      clientNotes: appointments.clientNotes,
      cancellationReason: appointments.cancellationReason,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      serviceName: services.name,
      serviceDuration: services.duration,
      servicePrice: services.price,
      employeeName: employees.name
    })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(employees, eq(appointments.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(appointments.appointmentDate, appointments.startTime);

    // Transform to include employee object for frontend compatibility
    const transformedAppointments = appointmentsList.map(apt => ({
      ...apt,
      employee: apt.employeeId ? { id: apt.employeeId, name: apt.employeeName } : null
    }));

    res.json({
      success: true,
      data: transformedAppointments,
      total: transformedAppointments.length
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
 * Create appointment manually (business owner only)
 * POST /api/appointments
 * Body: {
 *   businessId, serviceId, appointmentDate, startTime,
 *   clientFirstName, clientLastName, clientEmail, clientPhone, notes, clientNotes
 * }
 */
export const createManualAppointment = async (req, res) => {
  try {
    const {
      businessId,
      serviceId,
      appointmentDate,
      startTime,
      clientFirstName,
      clientLastName,
      clientEmail,
      clientPhone,
      notes,
      clientNotes
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!businessId || !serviceId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'businessId, serviceId, appointmentDate, and startTime are required'
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

    const businessData = business[0];

    // Get service and verify it belongs to this business
    const service = await db.select().from(services)
      .where(and(
        eq(services.id, serviceId),
        eq(services.businessId, businessId),
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

    // Business owners can create appointments at ANY time (for emergencies, custom scheduling, etc.)
    // We skip slot availability validation for manual appointments
    // This allows flexibility for phone bookings, emergency appointments, etc.

    // Validate time format (HH:MM or HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format.'
      });
    }

    // Normalize time to HH:MM format
    const normalizedStartTime = startTime.substring(0, 5);

    // Calculate end time
    const [hours, minutes] = normalizedStartTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + serviceData.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Create appointment (manually created appointments are auto-confirmed)
    const newAppointment = {
      id: randomUUID(),
      businessId: businessData.id,
      serviceId: serviceData.id,
      clientUserId: null, // Manual booking
      clientFirstName,
      clientLastName,
      clientEmail: clientEmail.toLowerCase().trim(),
      clientPhone,
      appointmentDate,
      startTime: normalizedStartTime,
      endTime,
      status: 'CONFIRMED', // Manual appointments are auto-confirmed
      isEmailConfirmed: true, // Skip email confirmation for manual bookings
      emailConfirmationToken: null,
      notes: notes || null,
      clientNotes: clientNotes || null,
      cancellationReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.insert(appointments).values(newAppointment);

    // Send confirmation email to client
    try {
      await sendAppointmentConfirmationEmail({
        to: clientEmail,
        clientName: `${clientFirstName} ${clientLastName}`,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime: normalizedStartTime,
        endTime,
        requiresConfirmation: false,
        confirmationToken: null,
        businessAddress: businessData.address,
        businessPhone: businessData.phone,
        businessEmail: businessData.email
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        id: newAppointment.id,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        appointmentDate,
        startTime: normalizedStartTime,
        endTime,
        status: newAppointment.status,
        clientFirstName,
        clientLastName,
        clientEmail,
        clientPhone
      }
    });

  } catch (error) {
    console.error('Create manual appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment',
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

    // Get appointment with service and employee info
    const appointment = await db.select({
      appointment: appointments,
      service: services,
      business: businesses,
      employee: employees
    })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(businesses, eq(appointments.businessId, businesses.id))
      .leftJoin(employees, eq(appointments.employeeId, employees.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { appointment: apt, service, business, employee } = appointment[0];

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
        businessName: business?.businessName,
        employee: employee ? { id: employee.id, name: employee.name } : null
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

    // Send cancellation email if status is CANCELLED
    if (status === 'CANCELLED') {
      try {
        const apt = appointment[0];
        const businessData = business[0];

        // Get service details
        const service = await db.select().from(services)
          .where(eq(services.id, apt.serviceId))
          .limit(1);

        if (service.length) {
          await sendCancellationEmail({
            to: apt.clientEmail,
            clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
            businessName: businessData.businessName,
            serviceName: service[0].name,
            appointmentDate: apt.appointmentDate,
            startTime: apt.startTime,
            cancellationReason: cancellationReason || null,
            businessPhone: businessData.phone,
            businessEmail: businessData.email
          });
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
        // Don't fail the request if email fails
      }
    }

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

    // Business owners can reschedule to ANY time (for emergencies, custom appointments, etc.)
    // We skip slot availability validation for admin rescheduling
    // This allows flexibility for emergency appointments, custom scheduling, etc.

    // Validate time format (HH:MM or HH:MM:SS)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM format.'
      });
    }

    // Normalize time to HH:MM format
    const normalizedStartTime = startTime.substring(0, 5);

    // Calculate new end time
    const [hours, minutes] = normalizedStartTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + serviceData.duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Update appointment
    await db.update(appointments)
      .set({
        appointmentDate,
        startTime: normalizedStartTime,
        endTime,
        serviceId: targetServiceId,
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointmentId));

    // Send reschedule notification email
    try {
      const businessData = business[0];

      await sendRescheduleEmail({
        to: apt.clientEmail,
        clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
        businessName: businessData.businessName,
        serviceName: serviceData.name,
        oldDate: apt.appointmentDate,
        oldStartTime: apt.startTime,
        newDate: appointmentDate,
        newStartTime: normalizedStartTime,
        newEndTime: endTime
      });
    } catch (emailError) {
      console.error('Failed to send reschedule email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentDate,
        startTime: normalizedStartTime,
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

/**
 * Confirm appointment (business owner manual approval)
 * PUT /api/appointments/:appointmentId/confirm
 */
export const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Get appointment with business info
    const appointment = await db.select({
      appointment: appointments,
      business: businesses
    })
      .from(appointments)
      .innerJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!appointment.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const { appointment: apt, business } = appointment[0];

    // Verify ownership
    if (business.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this appointment'
      });
    }

    // Check if already confirmed
    if (apt.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already confirmed'
      });
    }

    // Check if cancelled
    if (apt.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm a cancelled appointment'
      });
    }

    // Update status to CONFIRMED
    await db.update(appointments)
      .set({
        status: 'CONFIRMED',
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointmentId));

    // Send confirmation email to client
    try {
      const service = await db.select().from(services)
        .where(eq(services.id, apt.serviceId))
        .limit(1);

      if (service.length) {
        await sendAppointmentConfirmationEmail({
          to: apt.clientEmail,
          clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
          businessName: business.businessName,
          serviceName: service[0].name,
          appointmentDate: apt.appointmentDate,
          startTime: apt.startTime,
          endTime: apt.endTime,
          requiresConfirmation: false,
          confirmationToken: null,
          businessAddress: business.address,
          businessPhone: business.phone,
          businessEmail: business.email
        });
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: {
        status: 'CONFIRMED'
      }
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
 * Cancel appointment by client (public endpoint)
 * POST /api/public/cancel-appointment
 * Body: { appointmentId, email, cancellationReason }
 *
 * Clients can cancel their own appointments if:
 * - The email matches the appointment
 * - The cancellation is within the allowed cancellation notice period
 */
export const cancelAppointmentByClient = async (req, res) => {
  try {
    const { appointmentId, email, cancellationReason } = req.body;

    if (!appointmentId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and email are required'
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

    // Verify email matches
    if (apt.clientEmail.toLowerCase() !== email.toLowerCase().trim()) {
      return res.status(403).json({
        success: false,
        message: 'Email does not match appointment record'
      });
    }

    // Check if already cancelled
    if (apt.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
    const now = new Date();
    if (appointmentDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel past appointments'
      });
    }

    // Get business settings for cancellation notice period
    const business = await db.select().from(businesses)
      .where(eq(businesses.id, apt.businessId))
      .limit(1);

    if (!business.length) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    const businessData = business[0];
    const settings = businessData.settings || {};
    const cancellationNotice = settings.cancellationNotice ?? 24; // default 24 hours

    // Check cancellation notice period
    if (cancellationNotice > 0) {
      const cancellationNoticeMs = cancellationNotice * 60 * 60 * 1000;
      const timeDiff = appointmentDateTime.getTime() - now.getTime();

      if (timeDiff < cancellationNoticeMs) {
        const hoursRemaining = Math.floor(timeDiff / (60 * 60 * 1000));
        return res.status(400).json({
          success: false,
          message: `Appointments must be cancelled at least ${cancellationNotice} hours in advance. Your appointment is in ${hoursRemaining} hours.`
        });
      }
    }

    // Cancel the appointment
    await db.update(appointments)
      .set({
        status: 'CANCELLED',
        cancellationReason: cancellationReason || 'Cancelled by client',
        updatedAt: new Date().toISOString()
      })
      .where(eq(appointments.id, appointmentId));

    // Send cancellation confirmation email to client
    try {
      const service = await db.select().from(services)
        .where(eq(services.id, apt.serviceId))
        .limit(1);

      if (service.length) {
        await sendCancellationEmail({
          to: apt.clientEmail,
          clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
          businessName: businessData.businessName,
          serviceName: service[0].name,
          appointmentDate: apt.appointmentDate,
          startTime: apt.startTime,
          cancellationReason: cancellationReason || 'Cancelled by client',
          businessPhone: businessData.phone,
          businessEmail: businessData.email
        });
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the request if email fails
    }

    // Notify business owner
    try {
      const owner = await db.select().from(users)
        .where(eq(users.id, businessData.ownerId))
        .limit(1);

      if (owner.length && owner[0].email) {
        await sendBusinessAlertEmail({
          to: owner[0].email,
          businessName: businessData.businessName,
          clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
          clientPhone: apt.clientPhone,
          serviceName: 'Appointment Cancelled',
          appointmentDate: apt.appointmentDate,
          startTime: apt.startTime,
          endTime: apt.endTime,
          isCancellation: true
        });
      }
    } catch (emailError) {
      console.error('Failed to send business alert email:', emailError);
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel appointment by client error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  createGuestAppointment,
  confirmAppointmentEmail,
  createManualAppointment,
  getBusinessAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment,
  confirmAppointment,
  cancelAppointmentByClient
};
