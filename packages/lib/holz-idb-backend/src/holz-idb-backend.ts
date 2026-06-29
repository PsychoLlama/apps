import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Log, LogProcessor } from '@holz/core';
import { createLogValve } from '@lib/holz-valve';

/** Database holz logs are persisted to. One per origin. */
const DATABASE_NAME = '@holz';

/**
 * Schema version this code knows how to create. Bump it alongside an `upgrade`
 * migration whenever the indexes change. Reconnecting tabs open at whatever
 * version currently exists, so they ride past this without needing to know it.
 */
const DATABASE_VERSION = 1;

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

/**
 * Logs held while the database is unavailable — during the initial open and
 * across schema upgrades. Generous enough to ride out either, bounded so a
 * stalled connection (a peer that never closes for an upgrade, a hung open)
 * can't grow the buffer without limit.
 */
const DEFAULT_BUFFER_CAPACITY = 10_000;

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
 * Open the holz log database at {@link DATABASE_VERSION}, creating its schema on
 * first use. Runs the same in the main thread, workers, and service workers —
 * `indexedDB` is available in all three.
 *
 * `relinquish` is wired to both `blocking` (another context is upgrading and
 * waiting on this connection to close) and `terminated` (the browser killed the
 * connection), so the caller can step aside and reconnect rather than go dark.
 */
const openLogDatabase = (
  relinquish: () => void,
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
 * Reconnect to the database at whatever version currently exists — another
 * context may already have migrated the schema past {@link DATABASE_VERSION}.
 * Deliberately no `upgrade`: a reconnecting tab writes to the `logs` store, it
 * doesn't migrate. Still relinquishes on `blocking`/`terminated` so it can step
 * aside again if the schema moves a second time.
 */
const reopenLogDatabase = (
  relinquish: () => void,
): Promise<IDBPDatabase<LogDatabase>> =>
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
const isVersionError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'VersionError';

/** Options for {@link createIdbBackend}. */
export interface CreateIdbBackendOptions {
  /**
   * How many logs to retain while the database is unavailable. Once full, the
   * oldest are dropped. Defaults to {@link DEFAULT_BUFFER_CAPACITY}; pass
   * `Infinity` to buffer without bound, `0` to drop everything emitted before
   * the connection is live.
   */
  bufferCapacity?: number;
}

/**
 * Create the holz backend. Returns a {@link LogProcessor} synchronously — logs
 * emitted before IndexedDB finishes opening are buffered and flushed once it
 * does, so callers wire it into a pipeline without awaiting an open.
 *
 * Each log is appended to the `logs` store. Holz calls processors
 * synchronously, so writes are fire-and-forget: they can't block the calling
 * thread, and ordering is preserved by the store's auto-incrementing key.
 *
 * When another context upgrades the schema, this connection steps aside —
 * closing so the upgrade can proceed, buffering in the meantime, and
 * reconnecting at the new version on the next log instead of going dark.
 */
export const createIdbBackend = (
  options: CreateIdbBackendOptions = {},
): LogProcessor => {
  const { bufferCapacity = DEFAULT_BUFFER_CAPACITY } = options;

  let db: IDBPDatabase<LogDatabase> | null = null;
  let connecting = false;
  let migrated = false;

  // Logs flow downstream into whichever connection is currently live. The valve
  // only opens once `db` is set, so the write path normally has a connection;
  // the `?.` is belt-and-suspenders, since logging must never throw.
  const valve = createLogValve({
    capacity: bufferCapacity,
    processor: (log) => {
      db?.add(STORE_NAME, log).catch(() => {
        // A failed write (quota exhausted, the connection closing mid-flush)
        // drops the log rather than surfacing — there's no safe way to report
        // it without recursing into the logger.
      });
    },
  });

  /**
   * Step aside when another context is upgrading the schema, or the browser
   * killed the connection. Close the gate so new logs buffer, drop the dead
   * connection, and let the next log trigger a lazy reconnect at the current
   * version.
   */
  const relinquish = () => {
    valve.close();
    db?.close();
    db = null;
  };

  const connect = async () => {
    if (connecting || db !== null) return;
    connecting = true;

    try {
      // The first connection migrates the schema to the version this code
      // knows. If a peer already moved it forward, that versioned open is
      // rejected with a VersionError — fall through to reopen at the current
      // version. Once migrated, reconnects skip straight to that path.
      if (!migrated) {
        try {
          db = await openLogDatabase(relinquish);
        } catch (error) {
          if (!isVersionError(error)) throw error;
        }
      }
      db ??= await reopenLogDatabase(relinquish);

      migrated = true;
      valve.open(); // Flush everything buffered while we were connecting.
    } catch {
      // The open failed (quota, permissions, a blocked upgrade that never
      // resolved). Stay closed and buffering; the next log retries.
    } finally {
      connecting = false;
    }
  };

  // Buffer from the first log, then open eagerly so the schema migrates up
  // front rather than waiting on traffic.
  valve.close();
  void connect();

  return (log) => {
    // Reconnect on demand after stepping aside for an upgrade: rather than
    // racing to reopen the moment we close, wait here for the next log.
    if (db === null) void connect();
    valve.processor(log);
  };
};
