import { openDB, type DBSchema } from 'idb';
import type { Log, LogProcessor } from '@holz/core';

/** Database holz logs are persisted to. One per origin. */
const DATABASE_NAME = '@holz';

/** Object store every {@link Log} lands in. */
const STORE_NAME = 'logs';

/**
 * Index over `Log.timestamp`. Insertion order (the auto-incremented key)
 * tracks event time within one context, but several contexts — main thread,
 * workers, service workers — write to this store, and a late or buffered
 * producer can insert older logs after newer ones. The index restores true
 * chronological reads and time-window range queries.
 */
const TIMESTAMP_INDEX = 'by-timestamp';

interface LogDatabase extends DBSchema {
  [STORE_NAME]: {
    /** Auto-incremented insertion order; doubles as the read cursor. */
    key: number;
    value: Log;
    indexes: {
      [TIMESTAMP_INDEX]: number;
    };
  };
}

/**
 * Open the holz log database, creating its schema on first use. Runs the same
 * in the main thread, workers, and service workers — `indexedDB` is available
 * in all three.
 */
const openLogDatabase = () =>
  openDB<LogDatabase>(DATABASE_NAME, 1, {
    upgrade: (db) => {
      const store = db.createObjectStore(STORE_NAME, { autoIncrement: true });
      store.createIndex(TIMESTAMP_INDEX, 'timestamp');
    },
  });

/**
 * Create the holz backend. Opening the database up front migrates the schema
 * and surfaces quota or permission failures at construction rather than on the
 * first log.
 *
 * The returned {@link LogProcessor} is a noop for now — it accepts logs and
 * drops them. Persistence lands separately.
 */
export const createIdbBackend = async (): Promise<LogProcessor> => {
  await openLogDatabase();

  return () => {};
};
