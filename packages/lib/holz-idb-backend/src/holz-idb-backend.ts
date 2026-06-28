import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
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

export interface LogDatabase extends DBSchema {
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
const openLogDatabase = (): Promise<IDBPDatabase<LogDatabase>> =>
  openDB<LogDatabase>(DATABASE_NAME, 1, {
    upgrade: (database) => {
      const store = database.createObjectStore(STORE_NAME, {
        autoIncrement: true,
      });
      store.createIndex(TIMESTAMP_INDEX, 'timestamp');
    },
    // Deliberately no `blocking` handler. It would fire on a version bump or
    // `deleteDB`, and closing the connection there would silently kill logging
    // in an already-open tab (its queued writes reject with InvalidStateError,
    // swallowed below) with no reconnect. A graceful multi-tab handoff is a
    // problem for whenever the schema version actually moves; until then,
    // holding the connection open is the safe default.
  });

/**
 * Create the holz backend. Opening the database up front migrates the schema
 * and surfaces quota or permission failures at construction rather than on the
 * first log.
 *
 * The returned {@link LogProcessor} appends each log to the `logs` store. Holz
 * calls processors synchronously, so the write is fire-and-forget: it can't
 * block the calling thread, and ordering is preserved by the store's
 * auto-incrementing key.
 */
export const createIdbBackend = async (): Promise<LogProcessor> => {
  const db = await openLogDatabase();

  return (log) => {
    db.add(STORE_NAME, log).catch(() => {
      // Logging must never throw. A failed write (quota exhausted, the
      // connection closing mid-flush) drops the log rather than surfacing —
      // there's no safe way to report it without recursing into the logger.
    });
  };
};
