import cron from 'node-cron';
import db from '../config/database.js';
import { appointments, businesses } from '../config/schema.js';
import { eq, and, lt, or, sql } from 'drizzle-orm';
import { nowInTimezone, cutoffInTimezone } from '../utils/timezone.js';

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
 * Auto-complete past appointments for all businesses with the feature enabled
 */
export async function autoCompletePastAppointments() {
  try {
    console.log(`[AUTO-COMPLETE] Running auto-completion check...`);

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
      const businessTimezone = business.timezone || 'Europe/Skopje';
      const graceHours = settings.autoCompleteGraceHours ?? 24;

      // Compute cutoff date/time in the business's timezone
      const { cutoffDate, cutoffTime } = cutoffInTimezone(businessTimezone, graceHours);
      const { date: currentDate, timeWithSeconds: currentTime } = nowInTimezone(businessTimezone);

      console.log(`  [AUTO-COMPLETE] Processing business "${business.businessName}" (tz: ${businessTimezone}, grace: ${graceHours}h, cutoff: ${cutoffDate} ${cutoffTime})`);

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
    timezone: process.env.TZ || 'Europe/Skopje'
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
