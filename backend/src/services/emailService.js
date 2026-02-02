import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  // For development/testing, use Ethereal (fake SMTP service)
  // For production, use real SMTP service (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: Create test account automatically
    // You can also manually set EMAIL_USER and EMAIL_PASSWORD in .env for testing
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    // If no email credentials, log warning
    console.warn('⚠️  Email service not configured. Emails will be logged to console only.');
    return null;
  }
};

const transporter = createTransporter();

/**
 * Send verification email to user
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${process.env.APP_NAME || 'Appointments App'}!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering! Please click the button below to verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to ${process.env.APP_NAME || 'Appointments App'}!

      Please verify your email address by clicking the link below:
      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't create an account, you can safely ignore this email.
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Verification email sent:', info.messageId);

      // For development with Ethereal, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      // If email fails, log details for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Verification email (failed to send):');
        console.log('   To:', email);
        console.log('   Verification URL:', verificationUrl);
      }
      throw error;
    }
  } else {
    // Log email details if transporter is not configured
    console.log('📧 [EMAIL] Verification email (not sent - no email config):');
    console.log('   To:', email);
    console.log('   Verification URL:', verificationUrl);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send password reset email to user
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @returns {Promise<void>}
 */
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
              <p>If you continue to receive these emails, please contact support immediately.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request

      We received a request to reset your password. Click the link below to create a new password:
      ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email and your password will remain unchanged.

      If you continue to receive these emails, please contact support immediately.
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Password reset email sent:', info.messageId);

      // For development with Ethereal, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      // If email fails, log details for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Password reset email (failed to send):');
        console.log('   To:', email);
        console.log('   Reset URL:', resetUrl);
      }
      throw error;
    }
  } else {
    // Log email details if transporter is not configured
    console.log('📧 [EMAIL] Password reset email (not sent - no email config):');
    console.log('   To:', email);
    console.log('   Reset URL:', resetUrl);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send appointment confirmation email to client
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.clientName - Client full name
 * @param {string} params.businessName - Business name
 * @param {string} params.serviceName - Service name
 * @param {string} params.appointmentDate - Appointment date
 * @param {string} params.startTime - Start time
 * @param {string} params.endTime - End time
 * @param {boolean} params.requiresConfirmation - Whether email confirmation is required
 * @param {string} params.confirmationToken - Confirmation token (if required)
 * @param {string} params.businessAddress - Business address (optional)
 * @param {string} params.businessPhone - Business phone (optional)
 * @param {string} params.businessEmail - Business email (optional)
 * @returns {Promise<void>}
 */
export const sendAppointmentConfirmationEmail = async (params) => {
  const {
    to,
    clientName,
    businessName,
    serviceName,
    appointmentDate,
    startTime,
    endTime,
    requiresConfirmation,
    confirmationToken,
    businessAddress,
    businessPhone,
    businessEmail
  } = params;

  const confirmationUrl = requiresConfirmation
    ? `${process.env.CLIENT_URL}/confirm-appointment?token=${confirmationToken}`
    : null;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: requiresConfirmation
      ? 'Please Confirm Your Appointment'
      : 'Appointment Confirmed',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${requiresConfirmation ? '#4F46E5' : '#10B981'}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid ${requiresConfirmation ? '#4F46E5' : '#10B981'}; }
            .button { display: inline-block; background-color: ${requiresConfirmation ? '#4F46E5' : '#10B981'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${requiresConfirmation ? '📧 Please Confirm Your Appointment' : '✓ Appointment Confirmed'}</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              ${requiresConfirmation
                ? '<p>Thank you for booking an appointment! Please click the button below to confirm your booking:</p>'
                : '<p>Your appointment has been confirmed!</p>'
              }
              <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <p><strong>Business:</strong> ${businessName}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
                ${businessAddress || businessPhone || businessEmail
                  ? `<hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                     <h4 style="margin-bottom: 10px;">Business Contact Information:</h4>`
                  : ''
                }
                ${businessAddress ? `<p>📍 <strong>Address:</strong> ${businessAddress}</p>` : ''}
                ${businessPhone ? `<p>📞 <strong>Phone:</strong> ${businessPhone}</p>` : ''}
                ${businessEmail ? `<p>✉️  <strong>Email:</strong> ${businessEmail}</p>` : ''}
              </div>
              ${requiresConfirmation
                ? `<a href="${confirmationUrl}" class="button">Confirm Appointment</a>
                   <p>Or copy and paste this link into your browser:</p>
                   <p style="word-break: break-all; color: #4F46E5;">${confirmationUrl}</p>
                   <p><strong>Important:</strong> Your appointment will only be confirmed after you click the confirmation link.</p>`
                : '<p>We look forward to seeing you!</p>'
              }
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      ${requiresConfirmation ? 'Please Confirm Your Appointment' : 'Appointment Confirmed'}

      Hello ${clientName},

      ${requiresConfirmation
        ? 'Thank you for booking an appointment! Please confirm your booking by clicking the link below:'
        : 'Your appointment has been confirmed!'
      }

      Appointment Details:
      Business: ${businessName}
      Service: ${serviceName}
      Date: ${appointmentDate}
      Time: ${startTime} - ${endTime}
      ${businessAddress || businessPhone || businessEmail ? '\n      Business Contact Information:' : ''}
      ${businessAddress ? `Address: ${businessAddress}` : ''}
      ${businessPhone ? `Phone: ${businessPhone}` : ''}
      ${businessEmail ? `Email: ${businessEmail}` : ''}

      ${requiresConfirmation
        ? `\nConfirmation Link: ${confirmationUrl}\n\nImportant: Your appointment will only be confirmed after you click the confirmation link.`
        : '\nWe look forward to seeing you!'
      }
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Appointment email sent:', info.messageId);

      // For development with Ethereal, log preview URL
      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      // If email fails, log details for development
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Appointment email (failed to send):');
        console.log('   To:', to);
        if (confirmationUrl) {
          console.log('   Confirmation URL:', confirmationUrl);
        }
      }
      throw error;
    }
  } else {
    // Log email details if transporter is not configured
    console.log('📧 [EMAIL] Appointment email (not sent - no email config):');
    console.log('   To:', to);
    console.log('   Client:', clientName);
    console.log('   Business:', businessName);
    console.log('   Date:', appointmentDate, startTime);
    if (confirmationUrl) {
      console.log('   Confirmation URL:', confirmationUrl);
    }
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send appointment reminder email to client
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.clientName - Client full name
 * @param {string} params.businessName - Business name
 * @param {string} params.serviceName - Service name
 * @param {string} params.appointmentDate - Appointment date
 * @param {string} params.startTime - Start time
 * @param {string} params.endTime - End time
 * @param {string} params.businessPhone - Business contact phone
 * @param {string} params.businessEmail - Business contact email
 * @returns {Promise<void>}
 */
export const sendAppointmentReminderEmail = async (params) => {
  const {
    to,
    clientName,
    businessName,
    serviceName,
    appointmentDate,
    startTime,
    endTime,
    businessPhone,
    businessEmail
  } = params;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: `Reminder: Upcoming Appointment Tomorrow`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #F59E0B; }
            .reminder-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .contact-info { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Appointment Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>This is a friendly reminder about your upcoming appointment:</p>
              <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <p><strong>Business:</strong> ${businessName}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              </div>
              <div class="reminder-box">
                <p><strong>⏰ Your appointment is tomorrow!</strong></p>
                <p>Please arrive 5-10 minutes early if possible.</p>
              </div>
              ${businessPhone || businessEmail
                ? `<div class="contact-info">
                     <h4>Need to reschedule or have questions?</h4>
                     ${businessPhone ? `<p>📞 Phone: ${businessPhone}</p>` : ''}
                     ${businessEmail ? `<p>✉️  Email: ${businessEmail}</p>` : ''}
                   </div>`
                : ''
              }
              <p>We look forward to seeing you!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Appointment Reminder

      Hello ${clientName},

      This is a friendly reminder about your upcoming appointment:

      Appointment Details:
      Business: ${businessName}
      Service: ${serviceName}
      Date: ${appointmentDate}
      Time: ${startTime} - ${endTime}

      Your appointment is tomorrow!
      Please arrive 5-10 minutes early if possible.

      ${businessPhone ? `Phone: ${businessPhone}` : ''}
      ${businessEmail ? `Email: ${businessEmail}` : ''}

      We look forward to seeing you!
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Reminder email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Reminder email (failed to send):');
        console.log('   To:', to);
      }
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Reminder email (not sent - no email config):');
    console.log('   To:', to);
    console.log('   Appointment:', appointmentDate, startTime);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send cancellation notification email to client
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.clientName - Client full name
 * @param {string} params.businessName - Business name
 * @param {string} params.serviceName - Service name
 * @param {string} params.appointmentDate - Appointment date
 * @param {string} params.startTime - Start time
 * @param {string} params.cancellationReason - Reason for cancellation
 * @param {string} params.businessPhone - Business contact phone
 * @param {string} params.businessEmail - Business contact email
 * @returns {Promise<void>}
 */
export const sendCancellationEmail = async (params) => {
  const {
    to,
    clientName,
    businessName,
    serviceName,
    appointmentDate,
    startTime,
    cancellationReason,
    businessPhone,
    businessEmail
  } = params;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: 'Appointment Cancelled',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #DC2626; }
            .reason-box { background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0; }
            .contact-info { background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Appointment Cancelled</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>We regret to inform you that your appointment has been cancelled.</p>
              <div class="appointment-details">
                <h3>Cancelled Appointment:</h3>
                <p><strong>Business:</strong> ${businessName}</p>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${startTime}</p>
              </div>
              ${cancellationReason
                ? `<div class="reason-box">
                     <h4>Reason for Cancellation:</h4>
                     <p>${cancellationReason}</p>
                   </div>`
                : ''
              }
              ${businessPhone || businessEmail
                ? `<div class="contact-info">
                     <h4>Want to reschedule?</h4>
                     <p>Please contact us to book a new appointment:</p>
                     ${businessPhone ? `<p>📞 Phone: ${businessPhone}</p>` : ''}
                     ${businessEmail ? `<p>✉️  Email: ${businessEmail}</p>` : ''}
                   </div>`
                : ''
              }
              <p>We apologize for any inconvenience this may cause.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Appointment Cancelled

      Hello ${clientName},

      We regret to inform you that your appointment has been cancelled.

      Cancelled Appointment:
      Business: ${businessName}
      Service: ${serviceName}
      Date: ${appointmentDate}
      Time: ${startTime}

      ${cancellationReason ? `Reason: ${cancellationReason}` : ''}

      ${businessPhone ? `Phone: ${businessPhone}` : ''}
      ${businessEmail ? `Email: ${businessEmail}` : ''}

      We apologize for any inconvenience this may cause.
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Cancellation email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Cancellation email (failed to send):');
        console.log('   To:', to);
      }
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Cancellation email (not sent - no email config):');
    console.log('   To:', to);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send reschedule notification email to client
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.clientName - Client full name
 * @param {string} params.businessName - Business name
 * @param {string} params.serviceName - Service name
 * @param {string} params.oldDate - Old appointment date
 * @param {string} params.oldStartTime - Old start time
 * @param {string} params.newDate - New appointment date
 * @param {string} params.newStartTime - New start time
 * @param {string} params.newEndTime - New end time
 * @returns {Promise<void>}
 */
export const sendRescheduleEmail = async (params) => {
  const {
    to,
    clientName,
    businessName,
    serviceName,
    oldDate,
    oldStartTime,
    newDate,
    newStartTime,
    newEndTime
  } = params;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: 'Appointment Rescheduled',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #3B82F6; }
            .old-details { background-color: #FEE2E2; padding: 15px; border-radius: 5px; margin-bottom: 15px; text-decoration: line-through; opacity: 0.7; }
            .new-details { background-color: #D1FAE5; padding: 15px; border-radius: 5px; border-left: 4px solid #10B981; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Appointment Rescheduled</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>Your appointment has been rescheduled to a new date and time.</p>
              <div class="appointment-details">
                <h3>Business & Service:</h3>
                <p><strong>Business:</strong> ${businessName}</p>
                <p><strong>Service:</strong> ${serviceName}</p>

                <div class="old-details">
                  <h4>Previous Appointment:</h4>
                  <p>Date: ${oldDate}</p>
                  <p>Time: ${oldStartTime}</p>
                </div>

                <div class="new-details">
                  <h4>✓ New Appointment:</h4>
                  <p><strong>Date:</strong> ${newDate}</p>
                  <p><strong>Time:</strong> ${newStartTime} - ${newEndTime}</p>
                </div>
              </div>
              <p>Please save the new date and time. We look forward to seeing you!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Appointment Rescheduled

      Hello ${clientName},

      Your appointment has been rescheduled to a new date and time.

      Business: ${businessName}
      Service: ${serviceName}

      Previous Appointment:
      Date: ${oldDate}
      Time: ${oldStartTime}

      New Appointment:
      Date: ${newDate}
      Time: ${newStartTime} - ${newEndTime}

      Please save the new date and time. We look forward to seeing you!
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Reschedule email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Reschedule email (failed to send):');
        console.log('   To:', to);
      }
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Reschedule email (not sent - no email config):');
    console.log('   To:', to);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send new appointment alert to business owner
 * @param {Object} params - Email parameters
 * @param {string} params.to - Business owner email
 * @param {string} params.businessName - Business name
 * @param {string} params.clientName - Client full name
 * @param {string} params.clientPhone - Client phone
 * @param {string} params.serviceName - Service name
 * @param {string} params.appointmentDate - Appointment date
 * @param {string} params.startTime - Start time
 * @param {string} params.endTime - End time
 * @returns {Promise<void>}
 */
export const sendBusinessAlertEmail = async (params) => {
  const {
    to,
    businessName,
    clientName,
    clientPhone,
    serviceName,
    appointmentDate,
    startTime,
    endTime
  } = params;

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: '🔔 New Appointment Booked',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .appointment-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 2px solid #10B981; }
            .client-info { background-color: #DBEAFE; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Appointment Booked!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new appointment has been booked for <strong>${businessName}</strong>.</p>
              <div class="appointment-details">
                <h3>Appointment Details:</h3>
                <p><strong>Service:</strong> ${serviceName}</p>
                <p><strong>Date:</strong> ${appointmentDate}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
              </div>
              <div class="client-info">
                <h4>Client Information:</h4>
                <p><strong>Name:</strong> ${clientName}</p>
                <p><strong>Phone:</strong> ${clientPhone}</p>
              </div>
              <p>Please log in to your dashboard to view more details and manage this appointment.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      New Appointment Booked!

      A new appointment has been booked for ${businessName}.

      Appointment Details:
      Service: ${serviceName}
      Date: ${appointmentDate}
      Time: ${startTime} - ${endTime}

      Client Information:
      Name: ${clientName}
      Phone: ${clientPhone}

      Please log in to your dashboard to view more details and manage this appointment.
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Business alert email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Business alert email (failed to send):');
        console.log('   To:', to);
      }
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Business alert email (not sent - no email config):');
    console.log('   To:', to);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send a custom contact email from business to client (sent via system on behalf of business)
 * @param {Object} params - Email parameters
 * @param {string} params.to - Client email
 * @param {string} params.clientName - Client full name
 * @param {string} params.businessName - Business name
 * @param {string} params.businessEmail - Business reply-to email
 * @param {string} params.subject - Email subject
 * @param {string} params.message - Email message body
 * @returns {Promise<void>}
 */
export const sendContactEmail = async (params) => {
  const {
    to,
    clientName,
    businessName,
    businessEmail,
    subject,
    message
  } = params;

  const mailOptions = {
    from: `"${businessName} via ${process.env.APP_NAME || 'Appointments App'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    replyTo: businessEmail,
    to,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .message-box { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5; white-space: pre-wrap; }
            .reply-info { background-color: #DBEAFE; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Message from ${businessName}</h1>
            </div>
            <div class="content">
              <p>Hello ${clientName},</p>
              <p>You have received a message from <strong>${businessName}</strong>:</p>
              <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
              <div class="reply-info">
                <p><strong>To reply:</strong> Simply reply to this email and your message will be sent directly to ${businessName} at ${businessEmail}.</p>
              </div>
            </div>
            <div class="footer">
              <p>This message was sent via ${process.env.APP_NAME || 'Appointments App'} on behalf of ${businessName}.</p>
              <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Appointments App'}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Message from ${businessName}

Hello ${clientName},

You have received a message from ${businessName}:

---
${message}
---

To reply: Simply reply to this email and your message will be sent directly to ${businessName} at ${businessEmail}.

This message was sent via ${process.env.APP_NAME || 'Appointments App'} on behalf of ${businessName}.
    `,
  };

  // Log email details for debugging
  console.log('📧 [CONTACT EMAIL] Preparing to send:');
  console.log('   To:', to);
  console.log('   From:', mailOptions.from);
  console.log('   Reply-To:', businessEmail || '(not set)');
  console.log('   Subject:', subject);

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Contact email sent successfully:', info.messageId);
      console.log('   Accepted:', info.accepted);
      console.log('   Rejected:', info.rejected);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      console.error('📧 [EMAIL] Contact email FAILED to send:');
      console.error('   Error:', error.message);
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Contact email (not sent - no email config):');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Message:', message);
    return { messageId: 'dev-mode-no-email' };
  }
};

/**
 * Send welcome email after email verification
 * @param {string} email - Recipient email
 * @param {string} firstName - User first name
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (email, firstName) => {
  const dashboardUrl = `${process.env.CLIENT_URL}/dashboard`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@timesnap.io';

  const mailOptions = {
    from: `"${process.env.APP_NAME || 'TimeSnap.io'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to TimeSnap.io - Your Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px 0;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 50px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header:before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              animation: pulse 15s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            .logo-circle {
              display: inline-block;
              width: 80px;
              height: 80px;
              background: rgba(255,255,255,0.2);
              backdrop-filter: blur(10px);
              border-radius: 50%;
              margin-bottom: 20px;
              border: 3px solid rgba(255,255,255,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 36px;
              font-weight: bold;
              position: relative;
              z-index: 1;
            }
            .header h1 {
              font-size: 36px;
              font-weight: 800;
              margin: 0 0 10px 0;
              position: relative;
              z-index: 1;
              text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }
            .header p {
              font-size: 18px;
              opacity: 0.95;
              position: relative;
              z-index: 1;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
              padding: 30px;
              border-radius: 12px;
              margin-bottom: 30px;
              border-left: 5px solid #667eea;
              box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }
            .greeting h2 {
              color: #4338ca;
              font-size: 28px;
              margin-bottom: 15px;
              font-weight: 700;
            }
            .greeting p {
              color: #4b5563;
              font-size: 16px;
              line-height: 1.7;
            }
            .features-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 15px;
              margin: 30px 0;
            }
            .feature-card {
              background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
              padding: 20px;
              border-radius: 10px;
              border: 2px solid #e5e7eb;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            .feature-card:before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              width: 5px;
              height: 100%;
              background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
            }
            .feature-icon {
              display: inline-block;
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              text-align: center;
              line-height: 40px;
              font-size: 20px;
              margin-bottom: 10px;
              box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
            }
            .feature-card h4 {
              color: #1f2937;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 5px;
            }
            .feature-card p {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
              margin: 0;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
              padding: 30px;
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-radius: 12px;
              box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 700;
              font-size: 16px;
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
            }
            .quick-start {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border-left: 5px solid #10b981;
            }
            .quick-start h3 {
              color: #065f46;
              font-size: 20px;
              margin-bottom: 15px;
              font-weight: 700;
            }
            .step {
              padding: 12px 0 12px 35px;
              position: relative;
              color: #047857;
              font-size: 15px;
              font-weight: 500;
            }
            .step:before {
              content: attr(data-number);
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 26px;
              height: 26px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border-radius: 50%;
              text-align: center;
              line-height: 26px;
              font-size: 12px;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            .help-box {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border: 2px solid #93c5fd;
            }
            .help-box h3 {
              color: #1e40af;
              font-size: 20px;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .help-box p {
              color: #1e3a8a;
              font-size: 15px;
              margin: 10px 0;
            }
            .contact-info {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
              border: 1px solid #bfdbfe;
            }
            .contact-info a {
              color: #667eea;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
            }
            .quote-section {
              text-align: center;
              padding: 30px;
              margin: 30px 0;
              background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
              border-radius: 12px;
              border-left: 5px solid #ec4899;
            }
            .quote-section p {
              font-size: 20px;
              font-style: italic;
              color: #831843;
              font-weight: 600;
              margin: 0;
            }
            .footer {
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              color: #9ca3af;
              padding: 30px;
              text-align: center;
            }
            .footer-logo {
              font-size: 24px;
              font-weight: 800;
              color: white;
              margin-bottom: 10px;
            }
            .footer-links {
              margin: 20px 0;
            }
            .footer-links a {
              color: #a78bfa;
              text-decoration: none;
              margin: 0 15px;
              font-weight: 500;
              font-size: 14px;
            }
            .social-icons {
              margin: 20px 0;
            }
            .social-icon {
              display: inline-block;
              width: 35px;
              height: 35px;
              background: rgba(167, 139, 250, 0.2);
              border-radius: 50%;
              margin: 0 8px;
              line-height: 35px;
              font-size: 16px;
              color: #a78bfa;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
              margin: 30px 0;
            }
            @media only screen and (max-width: 600px) {
              .header h1 { font-size: 28px; }
              .greeting h2 { font-size: 22px; }
              .content { padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
              <div class="logo-circle">⏰</div>
              <h1>Welcome to TimeSnap.io!</h1>
              <p>Your journey to effortless appointment management starts now</p>
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Greeting -->
              <div class="greeting">
                <h2>Hello ${firstName}! 👋</h2>
                <p>We're thrilled to have you on board! Your email has been verified and your account is now <strong>active and ready to go</strong>.</p>
                <p style="margin-top: 10px;">TimeSnap.io is your complete solution for managing appointments, bookings, and client relationships. Whether you're running a salon, dental practice, consulting business, or any service-based operation, we've built everything you need to succeed.</p>
              </div>

              <!-- Features Grid -->
              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon">🏢</div>
                  <h4>Create Your Business Profile</h4>
                  <p>Set up your unique booking page with custom branding and make it yours</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">💼</div>
                  <h4>Manage Services Effortlessly</h4>
                  <p>Add and configure services with custom pricing, durations, and descriptions</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">📅</div>
                  <h4>Set Your Availability</h4>
                  <p>Define working hours, breaks, and time off with flexible scheduling</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">🌍</div>
                  <h4>Accept Bookings 24/7</h4>
                  <p>Let clients book appointments anytime, anywhere, from any device</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">📊</div>
                  <h4>Track & Analyze</h4>
                  <p>View appointments in one dashboard with powerful analytics insights</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon">🔔</div>
                  <h4>Automated Notifications</h4>
                  <p>Send confirmations and reminders automatically to reduce no-shows</p>
                </div>
              </div>

              <!-- CTA Section -->
              <div class="cta-section">
                <h3 style="color: #92400e; font-size: 22px; margin-bottom: 15px; font-weight: 700;">Ready to Get Started?</h3>
                <p style="color: #78350f; margin-bottom: 20px; font-size: 16px;">Access your dashboard and start setting up your business profile today!</p>
                <a href="${dashboardUrl}" class="cta-button">Launch Your Dashboard 🚀</a>
              </div>

              <div class="divider"></div>

              <!-- Quick Start Guide -->
              <div class="quick-start">
                <h3>🎯 Your 5-Step Quick Start Guide</h3>
                <div class="step" data-number="1">Complete your business setup in the dashboard</div>
                <div class="step" data-number="2">Add your services with pricing and duration</div>
                <div class="step" data-number="3">Set your working hours and availability</div>
                <div class="step" data-number="4">Share your unique booking link with clients</div>
                <div class="step" data-number="5">Start accepting appointments and grow your business!</div>
              </div>

              <!-- Help Section -->
              <div class="help-box">
                <h3>💬 Need Help Getting Started?</h3>
                <p><strong>We're here for you!</strong> Our dedicated support team is ready to assist with:</p>
                <ul style="color: #1e3a8a; margin: 15px 0 15px 20px; font-size: 14px;">
                  <li>Setting up your business profile</li>
                  <li>Configuring services and availability</li>
                  <li>Customizing your booking page</li>
                  <li>Integrating with your existing workflow</li>
                  <li>Any questions you might have</li>
                </ul>
                <div class="contact-info">
                  <strong style="color: #1e40af;">📧 Contact us:</strong>
                  <a href="mailto:${supportEmail}">${supportEmail}</a>
                </div>
              </div>

              <!-- Quote Section -->
              <div class="quote-section">
                <p>"Simplify scheduling, amplify your business" ✨</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-logo">⏰ TimeSnap.io</div>
              <p style="margin: 10px 0; font-size: 14px;">Modern Appointment Management Made Simple</p>

              <div class="divider" style="background: linear-gradient(90deg, transparent 0%, #374151 50%, transparent 100%);"></div>

              <div class="footer-links">
                <a href="${process.env.CLIENT_URL}/about">About Us</a>
                <a href="${process.env.CLIENT_URL}/contact">Contact</a>
                <a href="${process.env.CLIENT_URL}/help">Help Center</a>
              </div>

              <p style="font-size: 13px; margin-top: 20px;">&copy; ${new Date().getFullYear()} TimeSnap.io. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      🎉 WELCOME TO TIMESNAP.IO!

      Hello ${firstName}! 👋

      We're thrilled to have you on board! Your email has been verified and your account is now active and ready to go.

      TimeSnap.io is your complete solution for managing appointments, bookings, and client relationships.

      ═══════════════════════════════════════

      WHAT YOU CAN DO WITH TIMESNAP.IO:

      🏢 Create Your Business Profile
         Set up your unique booking page with custom branding

      💼 Manage Services Effortlessly
         Add and configure services with pricing and durations

      📅 Set Your Availability
         Define working hours, breaks, and time off

      🌍 Accept Bookings 24/7
         Let clients book appointments anytime, anywhere

      📊 Track & Analyze
         View appointments in one dashboard with analytics

      🔔 Automated Notifications
         Send confirmations and reminders automatically

      ═══════════════════════════════════════

      🚀 READY TO GET STARTED?

      Access your dashboard: ${dashboardUrl}

      ═══════════════════════════════════════

      🎯 YOUR 5-STEP QUICK START GUIDE:

      1. Complete your business setup in the dashboard
      2. Add your services with pricing and duration
      3. Set your working hours and availability
      4. Share your unique booking link with clients
      5. Start accepting appointments and grow your business!

      ═══════════════════════════════════════

      💬 NEED HELP GETTING STARTED?

      We're here for you! Our support team is ready to assist with:
      • Setting up your business profile
      • Configuring services and availability
      • Customizing your booking page
      • Any questions you might have

      📧 Contact us: ${supportEmail}

      ═══════════════════════════════════════

      "Simplify scheduling, amplify your business" ✨

      ⏰ TimeSnap.io - Modern Appointment Management
      © ${new Date().getFullYear()} TimeSnap.io. All rights reserved.
    `,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✉️  Welcome email sent:', info.messageId);

      if (process.env.NODE_ENV !== 'production') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log('📧 Preview URL:', previewUrl);
        }
      }

      return info;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [EMAIL] Welcome email (failed to send):');
        console.log('   To:', email);
      }
      throw error;
    }
  } else {
    console.log('📧 [EMAIL] Welcome email (not sent - no email config):');
    console.log('   To:', email);
    console.log('   Name:', firstName);
    return { messageId: 'dev-mode-no-email' };
  }
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentReminderEmail,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendBusinessAlertEmail,
  sendContactEmail,
  sendWelcomeEmail,
};
