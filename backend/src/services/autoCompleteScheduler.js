import cron from 'node-cron';
import db from '../config/database.js';
import { appointments, businesses } from '../config/schema.js';
import { eq, and, lt, or, sql } from 'drizzle-orm';

/**
 * AUTO-COMPLETE SCHEDULER SERVICE
 *
 * Automatically marks past confirmed appointments as completed
 * and auto-cancels pending appointments that are past their date/time
 * based on business-specific settings.
 *
 * Settings used:
 * - autoCompleteAppointments: boolean (default: false) - Enable/disable auto-completion
 * - autoCompleteGraceHours: number (default: 24) - Hours after appointment end time before auto-completing/cancelling
 */

/**
 * Get the current date and time
 * @returns {{ currentDate: string, currentTime: string }} Current date in YYYY-MM-DD format and time in HH:MM:SS format
 */
function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}:${seconds}`;

  return { currentDate, currentTime, now };
}

/**
 * Calculate the cutoff datetime based on grace hours
 * @param {number} graceHours - Hours to subtract from current time
 * @returns {{ cutoffDate: string, cutoffTime: string }} Cutoff date and time
 */
function getCutoffDateTime(graceHours) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - graceHours);

  const year = cutoff.getFullYear();
  const month = String(cutoff.getMonth() + 1).padStart(2, '0');
  const day = String(cutoff.getDate()).padStart(2, '0');
  const cutoffDate = `${year}-${month}-${day}`;

  const hours = String(cutoff.getHours()).padStart(2, '0');
  const minutes = String(cutoff.getMinutes()).padStart(2, '0');
  const seconds = String(cutoff.getSeconds()).padStart(2, '0');
  const cutoffTime = `${hours}:${minutes}:${seconds}`;

  return { cutoffDate, cutoffTime };
}

/**
 * Auto-complete past appointments for all businesses with the feature enabled
 */
export async function autoCompletePastAppointments() {
  try {
    const { currentDate, currentTime } = getCurrentDateTime();

    console.log(`[AUTO-COMPLETE] Running auto-completion check at ${currentDate} ${currentTime}...`);

    // Get all businesses with auto-complete enabled
    const businessesWithAutoComplete = await db
      .select()
      .from(businesses);

    let totalCompleted = 0;
    let totalCancelled = 0;
    let businessesProcessed = 0;

    for (const business of businessesWithAutoComplete) {
      const settings = business.settings || {};

      // Skip if auto-complete is not enabled for this business
      if (!settings.autoCompleteAppointments) {
        continue;
      }

      businessesProcessed++;
      const graceHours = settings.autoCompleteGraceHours ?? 24;
      const { cutoffDate, cutoffTime } = getCutoffDateTime(graceHours);

      console.log(`  [AUTO-COMPLETE] Processing business "${business.businessName}" (grace: ${graceHours}h, cutoff: ${cutoffDate} ${cutoffTime})`);

      // Find confirmed appointments that are past the grace period
      // An appointment is eligible if:
      // 1. Status is CONFIRMED
      // 2. Either:
      //    a. appointmentDate < cutoffDate, OR
      //    b. appointmentDate = cutoffDate AND endTime < cutoffTime
      const eligibleAppointments = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.businessId, business.id),
          eq(appointments.status, 'CONFIRMED'),
          or(
            lt(appointments.appointmentDate, cutoffDate),
            and(
              eq(appointments.appointmentDate, cutoffDate),
              lt(appointments.endTime, cutoffTime)
            )
          )
        ));

      if (eligibleAppointments.length === 0) {
        console.log(`    No appointments to auto-complete`);
        continue;
      }

      // Update each eligible appointment
      for (const appointment of eligibleAppointments) {
        try {
          await db
            .update(appointments)
            .set({
              status: 'COMPLETED',
              completedAutomatically: true,
              updatedAt: new Date().toISOString()
            })
            .where(eq(appointments.id, appointment.id));

          totalCompleted++;
          console.log(`    Completed appointment ${appointment.id} (${appointment.appointmentDate} ${appointment.startTime})`);
        } catch (error) {
          console.error(`    Failed to complete appointment ${appointment.id}:`, error.message);
        }
      }

      console.log(`    Completed ${eligibleAppointments.length} appointments for this business`);

      // Find pending appointments that are past the grace period
      // An appointment is eligible for cancellation if:
      // 1. Status is PENDING
      // 2. Either:
      //    a. appointmentDate < cutoffDate, OR
      //    b. appointmentDate = cutoffDate AND endTime < cutoffTime
      const eligiblePendingAppointments = await db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.businessId, business.id),
          eq(appointments.status, 'PENDING'),
          or(
            lt(appointments.appointmentDate, cutoffDate),
            and(
              eq(appointments.appointmentDate, cutoffDate),
              lt(appointments.endTime, cutoffTime)
            )
          )
        ));

      if (eligiblePendingAppointments.length > 0) {
        // Update each eligible pending appointment
        for (const appointment of eligiblePendingAppointments) {
          try {
            await db
              .update(appointments)
              .set({
                status: 'CANCELLED',
                cancellationReason: 'Automatically cancelled - appointment time expired while pending',
                updatedAt: new Date().toISOString()
              })
              .where(eq(appointments.id, appointment.id));

            totalCancelled++;
            console.log(`    Auto-cancelled pending appointment ${appointment.id} (${appointment.appointmentDate} ${appointment.startTime})`);
          } catch (error) {
            console.error(`    Failed to cancel pending appointment ${appointment.id}:`, error.message);
          }
        }

        console.log(`    Auto-cancelled ${eligiblePendingAppointments.length} pending appointments for this business`);
      }
    }

    console.log(`[AUTO-COMPLETE] Complete: ${totalCompleted} appointments auto-completed and ${totalCancelled} pending appointments auto-cancelled across ${businessesProcessed} businesses`);

    return {
      totalCompleted,
      totalCancelled,
      businessesProcessed
    };
  } catch (error) {
    console.error('[AUTO-COMPLETE] Error:', error);
    throw error;
  }
}

/**
 * Start the auto-complete scheduler
 * Runs every hour by default (configurable via AUTO_COMPLETE_CRON_SCHEDULE env var)
 */
export function startAutoCompleteScheduler() {
  // Default to every hour at minute 30
  const cronSchedule = process.env.AUTO_COMPLETE_CRON_SCHEDULE || '30 * * * *';

  console.log(`[AUTO-COMPLETE] Starting scheduler with cron: ${cronSchedule}`);

  // Schedule the task
  const task = cron.schedule(cronSchedule, async () => {
    console.log(`[AUTO-COMPLETE] Running scheduled auto-complete job...`);
    try {
      await autoCompletePastAppointments();
    } catch (error) {
      console.error('[AUTO-COMPLETE] Job failed:', error);
    }
  }, {
    timezone: process.env.TZ || 'America/New_York'
  });

  // Optionally run immediately on startup for testing
  if (process.env.RUN_AUTO_COMPLETE_ON_STARTUP === 'true') {
    console.log('[AUTO-COMPLETE] Running initial check...');
    autoCompletePastAppointments().catch(err => {
      console.error('[AUTO-COMPLETE] Initial check failed:', err);
    });
  }

  return task;
}

/**
 * Stop the auto-complete scheduler
 * @param {cron.ScheduledTask} task - The cron task to stop
 */
export function stopAutoCompleteScheduler(task) {
  if (task) {
    task.stop();
    console.log('[AUTO-COMPLETE] Stopped');
  }
}

export default {
  autoCompletePastAppointments,
  startAutoCompleteScheduler,
  stopAutoCompleteScheduler
};
