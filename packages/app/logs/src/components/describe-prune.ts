import type { PruneRecord } from '@lib/holz-idb-backend/database';

/**
 * Spells the date out in the reader's locale, without the weekday — the notice
 * sits below a stack of day headings that already carry it, and the pruning
 * date is a footnote rather than another heading.
 */
const pruneDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });

/** Groups the count, so five figures of deleted logs stay readable. */
const pruneCount = new Intl.NumberFormat();

/**
 * One line describing the archive's newest gap: how many logs the last pruning
 * pass dropped, and when. Reads as a sentence rather than a stat, because it
 * appears where those logs themselves would have been.
 */
export const describePrune = (record: PruneRecord): string =>
  `${pruneCount.format(record.deleted)} ${record.deleted === 1 ? 'log' : 'logs'} deleted on ${pruneDate.format(record.timestamp)}`;
