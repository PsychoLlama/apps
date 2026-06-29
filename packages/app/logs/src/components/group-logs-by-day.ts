import type { Log } from '@lib/observability';

/** A single day's worth of logs, with a localized heading for the day. */
export interface LogDayGroup {
  /** Stable key for the day — the local calendar date as `YYYY-M-D`. */
  key: string;
  /** Localized day heading, e.g. `Monday, June 29, 2026`. */
  heading: string;
  /** Entries that fell on this day, in the order they were given. */
  logs: Log[];
}

/**
 * Spells the day out in the reader's locale. `dateStyle: 'full'` carries the
 * weekday, so a heading reads as a day a person recognizes rather than a bare
 * date.
 */
const dayHeading = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' });

/** The *local* calendar date of a timestamp, e.g. `2026-6-29`. */
const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/**
 * Bucket logs into per-day groups, preserving input order both across groups
 * and within each one — hand it a newest-first list and the newest day leads,
 * newest entry first inside it. Days are keyed by the *local* calendar date, so
 * a group's heading matches the wall-clock day the reader sees on its entries.
 */
export const groupLogsByDay = (logs: readonly Log[]): LogDayGroup[] => {
  // Keyed by day so out-of-order input still collapses to one group per day;
  // a Map keeps first-seen day order, which for a sorted list is the sort.
  const groups = new Map<string, LogDayGroup>();

  for (const log of logs) {
    const date = new Date(log.timestamp);
    const key = dayKey(date);
    const group = groups.get(key);

    if (group) {
      group.logs.push(log);
    } else {
      groups.set(key, { key, heading: dayHeading.format(date), logs: [log] });
    }
  }

  return [...groups.values()];
};
