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
    subject: 'Welcome to TimeSnap.io - Let\'s Get Started!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .welcome-box { background-color: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
            .features { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 15px 0; padding-left: 30px; position: relative; }
            .feature-item:before { content: "✓"; position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px; }
            .cta-button { display: inline-block; background-color: #4F46E5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
            .help-section { background-color: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .divider { border-top: 1px solid #e5e7eb; margin: 25px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">Welcome to TimeSnap.io!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your journey to effortless appointment management starts here</p>
            </div>
            <div class="content">
              <div class="welcome-box">
                <h2 style="margin-top: 0; color: #1f2937;">Hello ${firstName},</h2>
                <p>We're excited to have you on board! Your email has been verified and your account is now active.</p>
                <p><strong>TimeSnap.io</strong> is your all-in-one solution for managing appointments, bookings, and client relationships. Whether you run a salon, dental practice, consulting business, or any service-based operation, we've got you covered.</p>
              </div>

              <div class="features">
                <h3 style="color: #1f2937; margin-top: 0;">What you can do with TimeSnap.io:</h3>
                <div class="feature-item">
                  <strong>Create Your Business Profile</strong> - Set up your unique booking page with custom branding
                </div>
                <div class="feature-item">
                  <strong>Manage Services</strong> - Add and configure the services you offer with prices and durations
                </div>
                <div class="feature-item">
                  <strong>Set Your Availability</strong> - Define your working hours, breaks, and time off
                </div>
                <div class="feature-item">
                  <strong>Accept Bookings 24/7</strong> - Let clients book appointments anytime, from anywhere
                </div>
                <div class="feature-item">
                  <strong>Track & Manage</strong> - View all appointments in one dashboard with powerful analytics
                </div>
                <div class="feature-item">
                  <strong>Automated Notifications</strong> - Send confirmations and reminders automatically
                </div>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}" class="cta-button">Go to Dashboard</a>
              </div>

              <div class="divider"></div>

              <div class="help-section">
                <h3 style="color: #1f2937; margin-top: 0;">Need Help Getting Started?</h3>
                <p style="margin-bottom: 10px;"><strong>We're here to help!</strong></p>
                <p>Our support team is ready to assist you with:</p>
                <ul style="margin: 10px 0;">
                  <li>Setting up your business profile</li>
                  <li>Configuring your services and availability</li>
                  <li>Customizing your booking page</li>
                  <li>Any questions you might have</li>
                </ul>
                <p style="margin-top: 15px;">
                  <strong>Contact us:</strong> <a href="mailto:${supportEmail}" style="color: #4F46E5;">${supportEmail}</a>
                </p>
              </div>

              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1f2937;">Quick Start Guide:</h4>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Complete your business setup in the dashboard</li>
                  <li>Add your services with pricing and duration</li>
                  <li>Set your working hours and availability</li>
                  <li>Share your unique booking link with clients</li>
                  <li>Start accepting appointments!</li>
                </ol>
              </div>

              <p style="text-align: center; color: #6b7280; font-style: italic;">
                "Simplify scheduling, amplify your business"
              </p>
            </div>
            <div class="footer">
              <p><strong>TimeSnap.io</strong> - Modern Appointment Management</p>
              <p>&copy; ${new Date().getFullYear()} TimeSnap.io. All rights reserved.</p>
              <p style="margin-top: 15px;">
                <a href="${process.env.CLIENT_URL}/about" style="color: #4F46E5; text-decoration: none; margin: 0 10px;">About Us</a>
                <a href="${process.env.CLIENT_URL}/contact" style="color: #4F46E5; text-decoration: none; margin: 0 10px;">Contact</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to TimeSnap.io!

      Hello ${firstName},

      We're excited to have you on board! Your email has been verified and your account is now active.

      TimeSnap.io is your all-in-one solution for managing appointments, bookings, and client relationships.

      What you can do with TimeSnap.io:
      - Create Your Business Profile - Set up your unique booking page
      - Manage Services - Add services with prices and durations
      - Set Your Availability - Define working hours and time off
      - Accept Bookings 24/7 - Let clients book anytime, anywhere
      - Track & Manage - View all appointments in one dashboard
      - Automated Notifications - Send confirmations and reminders

      Go to Dashboard: ${dashboardUrl}

      NEED HELP GETTING STARTED?
      Our support team is ready to assist you with setup and configuration.
      Contact us: ${supportEmail}

      Quick Start Guide:
      1. Complete your business setup in the dashboard
      2. Add your services with pricing and duration
      3. Set your working hours and availability
      4. Share your unique booking link with clients
      5. Start accepting appointments!

      "Simplify scheduling, amplify your business"

      TimeSnap.io - Modern Appointment Management
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
