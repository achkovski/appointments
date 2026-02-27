/**
 * Frontend timezone utility module.
 * Uses browser built-in Intl API — zero external dependencies.
 */

const DEFAULT_TIMEZONE = 'Europe/Skopje';

/**
 * Get the current date and time in a specific timezone.
 * @param {string} tz - IANA timezone string (e.g. 'Europe/Skopje')
 * @returns {{ date: string, time: string, hours: number, minutes: number }}
 */
export function nowInTimezone(tz = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
  );
  const hour = parts.hour === '24' ? '00' : parts.hour;
  const h = parseInt(hour, 10);
  const m = parseInt(parts.minute, 10);

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`,
    hours: h,
    minutes: m,
  };
}

/**
 * Check if a given Date object represents "today" in a business timezone.
 * @param {Date} date - The date to check
 * @param {string} tz - IANA timezone string
 * @returns {boolean}
 */
export function isTodayInTimezone(date, tz = DEFAULT_TIMEZONE) {
  const { date: todayStr } = nowInTimezone(tz);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}` === todayStr;
}

/**
 * Check if a slot's start time has already passed in the business timezone.
 * @param {Date} selectedDate - The selected calendar date
 * @param {string} startTime - 'HH:MM' format
 * @param {string} tz - IANA timezone string
 * @returns {boolean}
 */
export function isSlotPastInTimezone(selectedDate, startTime, tz = DEFAULT_TIMEZONE) {
  if (!selectedDate || !startTime) return false;

  const { date: todayStr, hours: nowH, minutes: nowM } = nowInTimezone(tz);
  const y = selectedDate.getFullYear();
  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const d = String(selectedDate.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  // Past date — definitely past
  if (dateStr < todayStr) return true;
  // Future date — definitely not past
  if (dateStr > todayStr) return false;

  // Same day — compare time
  const [slotH, slotM] = startTime.split(':').map(Number);
  const slotMinutes = slotH * 60 + slotM;
  const nowMinutes = nowH * 60 + nowM;
  return slotMinutes <= nowMinutes;
}

/**
 * Get a Date object representing the start of "today" in the business timezone.
 * Useful for disabling past dates in calendar pickers.
 * @param {string} tz - IANA timezone string
 * @returns {Date}
 */
export function todayStartInTimezone(tz = DEFAULT_TIMEZONE) {
  const { date: todayStr } = nowInTimezone(tz);
  const [y, m, d] = todayStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export { DEFAULT_TIMEZONE };
