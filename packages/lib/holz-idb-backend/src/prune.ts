import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  TIMESTAMP_INDEX,
  connectToLogDatabase,
  type PruneRecord,
} from './database';

/** Options for {@link pruneLogs}. */
export interface PruneLogsOptions {
  /**
   * High-water mark. The archive is left alone until it holds more than this
   * many logs.
   */
  maxRecords: number;

  /**
   * How many logs a pass leaves behind. Must be below {@link maxRecords} — the
   * gap between the two is what a pass reclaims, and how long the archive goes
   * before the next one.
   */
  retainRecords: number;
}

/**
 * Drop the oldest logs when the archive has grown past `maxRecords`, and record
 * that it happened. Nothing else bounds the store — every context appends to it
 * forever — so something has to run this periodically. It's written for app
 * startup: one pass, self-contained, safe to fire and forget.
 *
 * Pruning is hysteretic. A pass triggers only above `maxRecords` and then cuts
 * all the way back to `retainRecords`, so the archive spends most of its life
 * between the two marks and most passes touch nothing. Trimming to the ceiling
 * instead would put every session a few logs over it, deleting on each load.
 *
 * Age is measured by `Log.timestamp`, matching the order logs read back in, not
 * by insertion order. A pass that deletes anything overwrites the archive's
 * {@link PruneRecord} so the resulting gap is visible afterward, and resolves
 * with it; a pass under the mark writes nothing and resolves `null`.
 *
 * Deletions and their record commit in one transaction — the archive is never
 * short logs it has no record of dropping.
 */
export const pruneLogs = async ({
  maxRecords,
  retainRecords,
}: PruneLogsOptions): Promise<PruneRecord | null> => {
  const db = await connectToLogDatabase();

  try {
    const tx = db.transaction([STORE_NAME, PRUNE_STORE_NAME], 'readwrite');
    const logs = tx.objectStore(STORE_NAME).index(TIMESTAMP_INDEX);
    const count = await logs.count();

    if (count <= maxRecords) {
      await tx.done;
      return null;
    }

    // Walk a cursor rather than deleting a key range: several producers write
    // this store and timestamps can repeat, so the count is the authority on
    // where to stop, not the value at the cutoff.
    const excess = count - retainRecords;
    let deleted = 0;
    for await (const cursor of logs.iterate()) {
      await cursor.delete();
      if (++deleted >= excess) break;
    }

    const record: PruneRecord = { timestamp: Date.now(), deleted };
    await tx.objectStore(PRUNE_STORE_NAME).put(record, PRUNE_RECORD_KEY);
    await tx.done;

    return record;
  } finally {
    db.close();
  }
};
