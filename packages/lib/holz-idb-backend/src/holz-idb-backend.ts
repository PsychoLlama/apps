import { openDB, type DBSchema } from 'idb';
import type { Log, LogProcessor } from '@holz/core';

/** Database holz logs are persisted to. One per origin. */
const DATABASE_NAME = '@holz';

/** Object store every {@link Log} lands in. */
const STORE_NAME = 'logs';

interface LogDatabase extends DBSchema {
  [STORE_NAME]: {
    /** Auto-incremented insertion order; doubles as the read cursor. */
    key: number;
    value: Log;
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
      db.createObjectStore(STORE_NAME, { autoIncrement: true });
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
