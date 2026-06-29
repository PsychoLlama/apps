import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Log } from '@holz/core';

/**
 * The on-disk contract for holz logs — names, version, and typed schema — plus
 * the openers that apply it. The single source of truth shared by the backend
 * and its tests, so both speak the same store names and value types.
 */

/** Database holz logs are persisted to. One per origin. */
export const DATABASE_NAME = '@holz';

/**
 * Schema version this code knows how to create. Bump it alongside the
 * {@link migrateLogDatabase} migration whenever the indexes change.
 * Reconnecting tabs open at whatever version currently exists, so they ride
 * past this without needing to know it.
 */
export const DATABASE_VERSION = 1;

/** Object store every {@link Log} lands in. */
export const STORE_NAME = 'logs';

/**
 * Index over `Log.timestamp`. Insertion order (the auto-incremented key)
 * tracks event time within one context, but several contexts — main thread,
 * workers, service workers — write to this store, and a late or buffered
 * producer can insert older logs after newer ones. The index restores true
 * chronological reads and time-window range queries.
 */
export const TIMESTAMP_INDEX = 'by-timestamp';

/** Typed schema for the holz log database, applied to every {@link openDB}. */
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
 * Step-aside hook wired to both `blocking` (a peer is upgrading and waiting on
 * this connection to close) and `terminated` (the browser killed the
 * connection), so a caller can relinquish and reconnect rather than go dark.
 * Omit it for short-lived opens — reads, tests — that close on their own.
 */
type Relinquish = () => void;

/**
 * Open the holz log database at {@link DATABASE_VERSION}, creating its schema on
 * first use. Runs the same in the main thread, workers, and service workers —
 * `indexedDB` is available in all three. Use this for the first connection of a
 * context, the one responsible for migrating the schema to the version this
 * code knows.
 */
export const migrateLogDatabase = (
  relinquish?: Relinquish,
): Promise<IDBPDatabase<LogDatabase>> =>
  openDB<LogDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database) => {
      const store = database.createObjectStore(STORE_NAME, {
        autoIncrement: true,
      });

      store.createIndex(TIMESTAMP_INDEX, 'timestamp');
    },

    blocking: relinquish,
    terminated: relinquish,
  });

/**
 * Open the database at whatever version currently exists, without migrating —
 * a peer may already have moved the schema past {@link DATABASE_VERSION}, and a
 * reconnecting tab (or a test reading the store back) writes the `logs` store
 * rather than owning its shape. Still relinquishes on `blocking`/`terminated`
 * so a long-lived connection can step aside if the schema moves again.
 */
export const openLogDatabase = (
  relinquish?: Relinquish,
): Promise<IDBPDatabase<LogDatabase>> =>
  openDB<LogDatabase>(DATABASE_NAME, undefined, {
    blocking: relinquish,
    terminated: relinquish,
  });

/**
 * Read every persisted log newest-first. Goes through the
 * {@link TIMESTAMP_INDEX} rather than the insertion key, so logs from
 * interleaved producers — main thread, workers, a buffered flush landing an
 * older log after a newer one — read back in true chronological order. The
 * index reads ascending (oldest-first); reverse it once so the viewer leads
 * with the most recent log. Opens a short-lived connection (no `relinquish`)
 * and closes it once the read resolves; the writing backend keeps its own
 * long-lived connection.
 *
 * Reads the whole store in one shot — fine for a viewer over an on-device
 * archive. Swap to a `'prev'`-direction cursor or a bounded range over the
 * index if the store grows past what's comfortable to hold in memory; a
 * `'prev'` cursor yields newest-first natively, no reverse needed.
 */
export const readLogsByTimestamp = async (): Promise<Log[]> => {
  const db = await openLogDatabase();
  try {
    // `getAllFromIndex` hands back a fresh array, so reversing in place is safe.
    const logs = await db.getAllFromIndex(STORE_NAME, TIMESTAMP_INDEX);
    return logs.reverse();
  } finally {
    db.close();
  }
};
