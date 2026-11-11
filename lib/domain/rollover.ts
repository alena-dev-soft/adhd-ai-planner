import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const DEFAULT_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const DEFAULT_ROLLOVER_HOUR = 7;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The planner date (YYYY-MM-DD) an instant belongs to. A day belongs to the
 * date it started: local wall-clock times before `rolloverHour` still count as
 * the previous date (rollover 7 → Tuesday 02:00 is Monday).
 */
export function plannerDate(
  instant: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
  rolloverHour: number = DEFAULT_ROLLOVER_HOUR,
): string {
  if (!Number.isInteger(rolloverHour) || rolloverHour < 0 || rolloverHour > 23) {
    throw new RangeError(`rollover hour out of range: ${rolloverHour}`);
  }
  const [localDate, localHour] = formatInTimeZone(instant, timeZone, "yyyy-MM-dd HH").split(" ");
  return Number(localHour) < rolloverHour ? addDaysToDate(localDate, -1) : localDate;
}

/** Monday (YYYY-MM-DD) of the ISO week containing `date` (YYYY-MM-DD). */
export function weekStart(date: string): string {
  return format(startOfWeek(toNoon(date), { weekStartsOn: 1 }), "yyyy-MM-dd");
}

/** Calendar arithmetic on a YYYY-MM-DD string, independent of the server time zone. */
export function addDaysToDate(date: string, days: number): string {
  return format(addDays(toNoon(date), days), "yyyy-MM-dd");
}

/** The 7 dates Monday–Sunday of the week that starts at `monday`. */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDate(monday, i));
}

// Noon local time keeps date math clear of DST transitions around midnight.
function toNoon(date: string): Date {
  if (!DATE_RE.test(date)) throw new RangeError(`invalid date: ${date}`);
  const parsed = parseISO(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || format(parsed, "yyyy-MM-dd") !== date) {
    throw new RangeError(`invalid date: ${date}`);
  }
  return parsed;
}
