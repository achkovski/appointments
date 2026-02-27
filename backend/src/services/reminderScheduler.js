import cron from 'node-cron';
import db from '../config/database.js';
import { appointments, businesses, services, users } from '../config/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendAppointmentReminderEmail } from './emailService.js';
import { nowInTimezone } from '../utils/timezone.js';

/**
 * REMINDER SCHEDULER SERVICE
 *
 * Automatically sends reminder emails for upcoming appointments
 * Runs daily to check for appointments happening tomorrow
 */

/**
 * Get tomorrow's date in YYYY-MM-DD format for a given timezone
 * @param {string} tz - IANA timezone string
 * @returns {string} Tomorrow's date
 */
function getTomorrowDate(tz = 'Europe/Skopje') {
  const { date: todayStr } = nowInTimezone(tz);
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const ty = tomorrow.getUTCFullYear();
  const tm = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const td = String(tomorrow.getUTCDate()).padStart(2, '0');
  return `${ty}-${tm}-${td}`;
}

/**
 * Send reminder emails for all appointments happening tomorrow
 */
export async function sendDailyReminders() {
  try {
    const tomorrowDate = getTomorrowDate();

    console.log(`📧 [REMINDER SCHEDULER] Checking for appointments on ${tomorrowDate}...`);

    // Get all confirmed appointments for tomorrow
    const tomorrowAppointments = await db
      .select({
        appointment: appointments,
        service: services,
        business: businesses
      })
      .from(appointments)
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(businesses, eq(appointments.businessId, businesses.id))
      .where(and(
        eq(appointments.appointmentDate, tomorrowDate),
        eq(appointments.status, 'CONFIRMED')
      ));

    console.log(`📧 [REMINDER SCHEDULER] Found ${tomorrowAppointments.length} appointments`);

    let sentCount = 0;
    let failedCount = 0;

    // Send reminder email for each appointment
    for (const record of tomorrowAppointments) {
      const { appointment: apt, service, business } = record;

      try {
        await sendAppointmentReminderEmail({
          to: apt.clientEmail,
          clientName: `${apt.clientFirstName} ${apt.clientLastName}`,
          businessName: business.businessName,
          serviceName: service.name,
          appointmentDate: apt.appointmentDate,
          startTime: apt.startTime,
          endTime: apt.endTime,
          businessPhone: business.phone,
          businessEmail: business.email
        });

        sentCount++;
        console.log(`  ✓ Sent reminder to ${apt.clientEmail} for appointment ${apt.id}`);
      } catch (error) {
        failedCount++;
        console.error(`  ✗ Failed to send reminder to ${apt.clientEmail}:`, error.message);
      }
    }

    console.log(`📧 [REMINDER SCHEDULER] Complete: ${sentCount} sent, ${failedCount} failed`);

    return {
      total: tomorrowAppointments.length,
      sent: sentCount,
      failed: failedCount
    };
  } catch (error) {
    console.error('📧 [REMINDER SCHEDULER] Error:', error);
    throw error;
  }
}

/**
 * Start the reminder scheduler
 * Runs every day at 10:00 AM (configurable)
 */
export function startReminderScheduler() {
  // Default to 10:00 AM if not configured
  const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 10 * * *';

  console.log(`📧 [REMINDER SCHEDULER] Starting scheduler with cron: ${cronSchedule}`);

  // Schedule the task
  const task = cron.schedule(cronSchedule, async () => {
    console.log(`📧 [REMINDER SCHEDULER] Running scheduled reminder job...`);
    try {
      await sendDailyReminders();
    } catch (error) {
      console.error('📧 [REMINDER SCHEDULER] Job failed:', error);
    }
  }, {
    timezone: process.env.TZ || 'Europe/Skopje'
  });

  // Optionally run immediately on startup for testing
  if (process.env.RUN_REMINDERS_ON_STARTUP === 'true') {
    console.log('📧 [REMINDER SCHEDULER] Running initial check...');
    sendDailyReminders().catch(err => {
      console.error('📧 [REMINDER SCHEDULER] Initial check failed:', err);
    });
  }

  return task;
}

/**
 * Stop the reminder scheduler
 * @param {cron.ScheduledTask} task - The cron task to stop
 */
export function stopReminderScheduler(task) {
  if (task) {
    task.stop();
    console.log('📧 [REMINDER SCHEDULER] Stopped');
  }
}

export default {
  sendDailyReminders,
  startReminderScheduler,
  stopReminderScheduler
};
