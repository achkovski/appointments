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
    confirmationToken
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

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
};
