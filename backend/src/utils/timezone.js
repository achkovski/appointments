/**
 * Timezone utility module.
 * Uses Node.js built-in Intl API — zero external dependencies.
 * All functions take an explicit IANA timezone string (e.g. 'Europe/Skopje').
 */

const DEFAULT_TIMEZONE = 'Europe/Skopje';

/**
 * Get the current date and time in a specific timezone.
 * @param {string} tz - IANA timezone string (e.g. 'Europe/Skopje')
 * @returns {{ date: string, time: string, timeWithSeconds: string }}
 *   date: 'YYYY-MM-DD', time: 'HH:MM', timeWithSeconds: 'HH:MM:SS'
 */
function nowInTimezone(tz = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
  );
  // en-CA gives hour "24" at midnight in some environments, normalize to "00"
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${hour}:${parts.minute}`;
  const timeWithSeconds = `${hour}:${parts.minute}:${parts.second}`;

  return { date, time, timeWithSeconds };
}

/**
 * Get current time-of-day as minutes since midnight in a timezone.
 * @param {string} tz - IANA timezone string
 * @returns {number} minutes since midnight
 */
function currentMinutesInTimezone(tz = DEFAULT_TIMEZONE) {
  const { time } = nowInTimezone(tz);
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Build a JS Date object (UTC) representing a specific date+time in a timezone.
 * Useful for comparing business-local appointment times against UTC "now".
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} timeStr - 'HH:MM'
 * @param {string} tz - IANA timezone string
 * @returns {Date} UTC Date object corresponding to that local date+time
 */
function localToUTC(dateStr, timeStr, tz = DEFAULT_TIMEZONE) {
  // Parse the target local time as if it were UTC
  const guess = new Date(`${dateStr}T${timeStr}:00Z`);
  // Discover the offset by comparing UTC vs timezone representations
  const utcStr = guess.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = guess.toLocaleString('en-US', { timeZone: tz });
  const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
  return new Date(guess.getTime() + diff);
}

/**
 * Compute a cutoff date/time by subtracting hours from "now" in a timezone.
 * Used by autoCompleteScheduler for grace period calculations.
 * @param {string} tz - IANA timezone string
 * @param {number} hoursToSubtract
 * @returns {{ cutoffDate: string, cutoffTime: string }}
 */
function cutoffInTimezone(tz = DEFAULT_TIMEZONE, hoursToSubtract) {
  const shifted = new Date(Date.now() - hoursToSubtract * 3600_000);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(shifted).map(({ type, value }) => [type, value])
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return {
    cutoffDate: `${parts.year}-${parts.month}-${parts.day}`,
    cutoffTime: `${hour}:${parts.minute}:${parts.second}`,
  };
}

/**
 * Validate that a string is a valid IANA timezone.
 * @param {string} tz
 * @returns {boolean}
 */
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export {
  DEFAULT_TIMEZONE,
  nowInTimezone,
  currentMinutesInTimezone,
  localToUTC,
  cutoffInTimezone,
  isValidTimezone,
};
