/**
 * Behavioral tests for archive pruning, against real IndexedDB (provided by
 * Chromium). Logs are seeded through the store directly rather than through a
 * logger: these tests care about record counts and timestamps, and writing them
 * by hand is the only way to pin either.
 */

import { level, type Log } from '@holz/core';

import { pruneLogs } from '../prune';
import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  connectToLogDatabase,
  type PruneRecord,
} from '../database';

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

/**
 * Append logs in the given order, stamped with the given event times. Insertion
 * order is the array's order; `timestamps` decides chronology, and the two only
 * agree when a test says so.
 */
const seedLogs = async (timestamps: number[]): Promise<void> => {
  const db = await connectToLogDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const timestamp of timestamps) {
      void tx.store.add(makeLog({ message: `log ${timestamp}`, timestamp }));
    }
    await tx.done;
  } finally {
    db.close();
  }
};

/** Every retained log's event time, oldest-first. */
const retainedTimestamps = async (): Promise<number[]> => {
  const db = await connectToLogDatabase();
  try {
    const logs = await db.getAll(STORE_NAME);
    return logs.map((log) => log.timestamp).sort((left, right) => left - right);
  } finally {
    db.close();
  }
};

/** Everything the pruning store holds — at most one record. */
const storedPruneRecords = async (): Promise<PruneRecord[]> => {
  const db = await connectToLogDatabase();
  try {
    return await db.getAll(PRUNE_STORE_NAME);
  } finally {
    db.close();
  }
};

describe('pruneLogs', () => {
  beforeEach(async () => {
    // Start every test from an empty archive. `connectToLogDatabase` creates
    // both stores if this is the first open of the origin.
    const db = await connectToLogDatabase();
    try {
      await Promise.all([db.clear(STORE_NAME), db.clear(PRUNE_STORE_NAME)]);
    } finally {
      db.close();
    }
  });

  it('cuts back to the retained count once past the high-water mark', async () => {
    await seedLogs([1, 2, 3, 4, 5, 6]);

    const record = await pruneLogs({ maxRecords: 5, retainRecords: 2 });

    expect(record).toMatchObject({ deleted: 4 });
    expect(await retainedTimestamps()).toEqual([5, 6]);
  });

  it('leaves the archive alone below the high-water mark', async () => {
    // Above the retained count but under the mark — the window pruning leaves
    // behind, so most sessions do nothing at all.
    await seedLogs([1, 2, 3, 4]);

    await expect(
      pruneLogs({ maxRecords: 5, retainRecords: 2 }),
    ).resolves.toBeNull();

    expect(await retainedTimestamps()).toEqual([1, 2, 3, 4]);
    expect(await storedPruneRecords()).toEqual([]);
  });

  it('treats the high-water mark as inclusive', async () => {
    await seedLogs([1, 2, 3]);

    // Exactly at the mark is not past it — nothing to delete, nothing to
    // record.
    await expect(
      pruneLogs({ maxRecords: 3, retainRecords: 1 }),
    ).resolves.toBeNull();

    expect(await retainedTimestamps()).toEqual([1, 2, 3]);
    expect(await storedPruneRecords()).toEqual([]);
  });

  it('measures age by event time, not insertion order', async () => {
    // A buffered producer flushing late writes an older log after a newer one.
    // Pruning must drop the log that happened first, not the one stored first.
    await seedLogs([300, 100, 200]);

    await pruneLogs({ maxRecords: 2, retainRecords: 1 });

    expect(await retainedTimestamps()).toEqual([300]);
  });

  it('records when logs were dropped and how many', async () => {
    await seedLogs([1, 2, 3]);

    const before = Date.now();
    const record = await pruneLogs({ maxRecords: 2, retainRecords: 1 });
    const after = Date.now();

    expect(record?.deleted).toBe(2);
    expect(record?.timestamp).toBeGreaterThanOrEqual(before);
    expect(record?.timestamp).toBeLessThanOrEqual(after);
    expect(await storedPruneRecords()).toEqual([record]);
  });

  it('overwrites the record in place on the next pass', async () => {
    // Pruning recurs for the life of the archive. Its bookkeeping has to stay
    // at one record, or it becomes the grow-only store pruning exists to
    // prevent.
    await seedLogs([1, 2, 3]);
    await pruneLogs({ maxRecords: 2, retainRecords: 1 });

    await seedLogs([4, 5, 6]);
    const second = await pruneLogs({ maxRecords: 2, retainRecords: 1 });

    expect(second).toMatchObject({ deleted: 3 });
    expect(await storedPruneRecords()).toEqual([second]);
  });

  it('keys the record so a reader can find it', async () => {
    await seedLogs([1, 2, 3]);
    const record = await pruneLogs({ maxRecords: 2, retainRecords: 1 });

    const db = await connectToLogDatabase();
    try {
      await expect(db.get(PRUNE_STORE_NAME, PRUNE_RECORD_KEY)).resolves.toEqual(
        record,
      );
    } finally {
      db.close();
    }
  });
});
