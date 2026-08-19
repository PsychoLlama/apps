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
export const DATABASE_VERSION = 2;

/** Object store every {@link Log} lands in. */
export const STORE_NAME = 'logs';

/**
 * Object store holding the single {@link PruneRecord}. Without it a pruned
 * archive is indistinguishable from one that never had those logs — the gap is
 * invisible.
 */
export const PRUNE_STORE_NAME = 'pruning';

/**
 * The one key {@link PRUNE_STORE_NAME} ever holds. Pruning recurs for the life
 * of the archive, so its bookkeeping is overwritten in place rather than
 * appended — a history of prunes would be the same grow-only store pruning
 * exists to bound.
 */
export const PRUNE_RECORD_KEY = 'latest';

/**
 * Index over `Log.timestamp`. Insertion order (the auto-incremented key)
 * tracks event time within one context, but several contexts — main thread,
 * workers, service workers — write to this store, and a late or buffered
 * producer can insert older logs after newer ones. The index restores true
 * chronological reads and time-window range queries.
 */
export const TIMESTAMP_INDEX = 'by-timestamp';

/**
 * The most recent pruning pass: when it ran and how many logs it dropped.
 * Absent until the first pass that actually deletes something, and replaced by
 * each pass after that — it dates the newest gap in the archive, not every gap.
 */
export interface PruneRecord {
  /** Wall-clock time (`Date.now()`) the pass committed. */
  timestamp: number;

  /** How many logs the pass deleted. Always greater than zero. */
  deleted: number;
}

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

  [PRUNE_STORE_NAME]: {
    /** Always {@link PRUNE_RECORD_KEY} — the store holds one record. */
    key: typeof PRUNE_RECORD_KEY;
    value: PruneRecord;
  };
}

/**
 * A live connection to the holz log database. The type a holder keeps when it
 * owns the connection's lifetime — opening it once and reading through it —
 * rather than reaching for a self-connecting helper like
 * {@link readLogsByTimestamp}.
 */
export type LogConnection = IDBPDatabase<LogDatabase>;

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
): Promise<LogConnection> =>
  openDB<LogDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade: (database, oldVersion) => {
      // Sequential, version-gated steps: a database at any older version
      // catches up by running every step it missed.
      if (oldVersion < 1) {
        const store = database.createObjectStore(STORE_NAME, {
          autoIncrement: true,
        });

        store.createIndex(TIMESTAMP_INDEX, 'timestamp');
      }

      if (oldVersion < 2) {
        // Out-of-line keys: the sole record is written at a fixed key rather
        // than carrying one.
        database.createObjectStore(PRUNE_STORE_NAME);
      }
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
): Promise<LogConnection> =>
  openDB<LogDatabase>(DATABASE_NAME, undefined, {
    blocking: relinquish,
    terminated: relinquish,
  });

/**
 * A versioned open rejects with a `VersionError` when the database already
 * exists at a higher version — a peer migrated past {@link DATABASE_VERSION}
 * before this context opened. The fix is to reconnect at the current version,
 * not give up.
 */
export const isVersionError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'VersionError';

/**
 * Open the database, migrating it to {@link DATABASE_VERSION} unless a peer
 * already moved it further along. The one-shot open for callers that just want
 * a working connection and don't care which of the two paths produced it — the
 * backend, which retries and reconnects on its own schedule, drives
 * {@link migrateLogDatabase} and {@link openLogDatabase} directly instead.
 */
export const connectToLogDatabase = async (
  relinquish?: Relinquish,
): Promise<LogConnection> => {
  try {
    return await migrateLogDatabase(relinquish);
  } catch (error) {
    if (!isVersionError(error)) throw error;
    return await openLogDatabase(relinquish);
  }
};

/**
 * Read every persisted log in event-time order (oldest-first). Goes through the
 * {@link TIMESTAMP_INDEX} rather than the insertion key, so logs from
 * interleaved producers — main thread, workers, a buffered flush landing an
 * older log after a newer one — read back in true chronological order. Opens a
 * short-lived connection (no `relinquish`) and closes it once the read
 * resolves; the writing backend keeps its own long-lived connection.
 *
 * A self-contained reader for one-shot reads and tests: it owns the connection
 * end to end. A consumer that holds a connection across many reads — like the
 * log viewer, which keeps a {@link LogConnection} and walks it newest-first
 * with a `'prev'` cursor — should read through that instead.
 */
export const readLogsByTimestamp = async (): Promise<Log[]> => {
  const db = await openLogDatabase();
  try {
    return await db.getAllFromIndex(STORE_NAME, TIMESTAMP_INDEX);
  } finally {
    db.close();
  }
};
