import cron from 'node-cron';
import db from '../config/database.js';
import { appointments, businesses } from '../config/schema.js';
import { eq, and, isNotNull, sql } from 'drizzle-orm';

/**
 * EMAIL CONFIRMATION SCHEDULER SERVICE
 *
 * Automatically cancels pending appointments that have not been
 * confirmed via email within the business's configured timeout.
 *
 * Runs every 5 minutes by default (lightweight query).
 *
 * Settings used:
 * - requireEmailConfirmation: boolean (on businesses table or in settings)
 * - emailConfirmationTimeout: number (default: 15 minutes, from business.settings)
 */

/**
 * Cancel expired unconfirmed appointments for all businesses with email confirmation enabled
 */
export async function cancelExpiredUnconfirmedAppointments() {
  try {
    console.log(`[EMAIL-CONFIRM] Running expired confirmation check...`);

    // Get all businesses that require email confirmation
    const allBusinesses = await db
      .select()
      .from(businesses);

    let totalCancelled = 0;
    let businessesProcessed = 0;

    for (const business of allBusinesses) {
      const settings = business.settings || {};

      // Check if email confirmation is required (column or settings)
      const requireEmailConfirmation = settings.requireEmailConfirmation ?? business.requireEmailConfirmation ?? false;
      if (!requireEmailConfirmation) {
        continue;
      }

      businessesProcessed++;
      const emailConfirmationTimeout = settings.emailConfirmationTimeout ?? 15; // default 15 minutes

      if (emailConfirmationTimeout <= 0) {
        continue; // No timeout configured, skip
      }

      // Find pending appointments that are unconfirmed and past the timeout
      // Compute cutoff in JS to avoid sql.raw() with user-derived values
      const timeoutMinutes = Math.max(1, parseInt(emailConfirmationTimeout, 10) || 15);
      const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const expiredAppointments = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.businessId, business.id),
          eq(appointments.status, 'PENDING'),
          eq(appointments.isEmailConfirmed, false),
          isNotNull(appointments.emailConfirmationToken),
          sql`${appointments.createdAt} < ${cutoff.toISOString()}`
        ));

      if (expiredAppointments.length === 0) {
        continue;
      }

      console.log(`  [EMAIL-CONFIRM] Business "${business.businessName}": found ${expiredAppointments.length} expired unconfirmed appointment(s) (timeout: ${emailConfirmationTimeout}min)`);

      for (const appointment of expiredAppointments) {
        try {
          await db
            .update(appointments)
            .set({
              status: 'CANCELLED',
              cancellationReason: `Automatically cancelled - email not confirmed within ${emailConfirmationTimeout} minutes`,
              emailConfirmationToken: null,
              updatedAt: new Date().toISOString()
            })
            .where(eq(appointments.id, appointment.id));

          totalCancelled++;
          console.log(`    Cancelled appointment ${appointment.id} (created: ${appointment.createdAt})`);
        } catch (error) {
          console.error(`    Failed to cancel appointment ${appointment.id}:`, error.message);
        }
      }
    }

    console.log(`[EMAIL-CONFIRM] Complete: ${totalCancelled} expired unconfirmed appointment(s) cancelled across ${businessesProcessed} business(es)`);

    return {
      totalCancelled,
      businessesProcessed
    };
  } catch (error) {
    console.error('[EMAIL-CONFIRM] Error:', error);
    throw error;
  }
}

/**
 * Start the email confirmation scheduler
 * Runs every 5 minutes by default (configurable via EMAIL_CONFIRMATION_CRON_SCHEDULE env var)
 */
export function startEmailConfirmationScheduler() {
  const cronSchedule = process.env.EMAIL_CONFIRMATION_CRON_SCHEDULE || '*/5 * * * *';

  console.log(`[EMAIL-CONFIRM] Starting scheduler with cron: ${cronSchedule}`);

  const task = cron.schedule(cronSchedule, async () => {
    console.log(`[EMAIL-CONFIRM] Running scheduled confirmation expiry check...`);
    try {
      await cancelExpiredUnconfirmedAppointments();
    } catch (error) {
      console.error('[EMAIL-CONFIRM] Job failed:', error);
    }
  }, {
    timezone: process.env.TZ || 'Europe/Skopje'
  });

  // Optionally run immediately on startup for testing
  if (process.env.RUN_EMAIL_CONFIRMATION_ON_STARTUP === 'true') {
    console.log('[EMAIL-CONFIRM] Running initial check...');
    cancelExpiredUnconfirmedAppointments().catch(err => {
      console.error('[EMAIL-CONFIRM] Initial check failed:', err);
    });
  }

  return task;
}

/**
 * Stop the email confirmation scheduler
 * @param {cron.ScheduledTask} task - The cron task to stop
 */
export function stopEmailConfirmationScheduler(task) {
  if (task) {
    task.stop();
    console.log('[EMAIL-CONFIRM] Stopped');
  }
}

export default {
  cancelExpiredUnconfirmedAppointments,
  startEmailConfirmationScheduler,
  stopEmailConfirmationScheduler
};
