import type { IDBPDatabase } from 'idb';
import type { LogProcessor } from '@holz/core';
import { createLogValve } from '@lib/holz-valve';

import {
  STORE_NAME,
  migrateLogDatabase,
  openLogDatabase,
  type LogDatabase,
} from './database';

/**
 * Logs held while the database is unavailable — during the initial open and
 * across schema upgrades. Generous enough to ride out either, bounded so a
 * stalled connection (a peer that never closes for an upgrade, a hung open)
 * can't grow the buffer without limit.
 */
const DEFAULT_BUFFER_CAPACITY = 10_000;

/**
 * A versioned open rejects with a `VersionError` when the database already
 * exists at a higher version — a peer migrated past `DATABASE_VERSION` before
 * this context opened. The fix is to reconnect at the current version, not give
 * up.
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

  // Logs flow downstream into whichever connection is currently live. Start
  // closed, buffering until the first open; the valve only opens once `db` is
  // set, so the write path normally has a connection — the `?.` is
  // belt-and-suspenders, since logging must never throw.
  //
  // Streaming logs (while open) write one at a time; the buffered batch released
  // on open drains through a single transaction so a flush — potentially
  // thousands of logs held across a connect or upgrade — is one round trip to
  // the store rather than one per log.
  const valve = createLogValve({
    capacity: bufferCapacity,
    open: false,
    processor: (log) => {
      db?.add(STORE_NAME, log).catch(() => {
        // A failed write (quota exhausted, the connection closing mid-flush)
        // drops the log rather than surfacing — there's no safe way to report
        // it without recursing into the logger.
      });
    },
    drain: (logs) => {
      // The valve only opens from within `connect`, which sets `db` first, and
      // `open` is the sole caller of `drain` — so a live connection is
      // guaranteed here. Assert it rather than silently dropping the batch.
      if (db === null) {
        throw new Error('Cannot drain logs: the database is not connected.');
      }

      // One transaction for the whole batch. `add` is fire-and-forget like the
      // streaming path; awaiting `tx.done` only catches a failed flush so it
      // drops rather than surfacing — reporting it would recurse into the logger.
      const tx = db.transaction(STORE_NAME, 'readwrite');
      for (const log of logs) void tx.store.add(log);
      tx.done.catch(() => {});
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
          db = await migrateLogDatabase(relinquish);
        } catch (error) {
          if (!isVersionError(error)) throw error;
        }
      }
      db ??= await openLogDatabase(relinquish);

      migrated = true;
      valve.open(); // Flush everything buffered while we were connecting.
    } catch {
      // The open failed (quota, permissions, a blocked upgrade that never
      // resolved). Stay closed and buffering; the next log retries.
    } finally {
      connecting = false;
    }
  };

  // The valve buffers from the first log; open eagerly so the schema migrates
  // up front rather than waiting on traffic.
  void connect();

  return (log) => {
    // Reconnect on demand after stepping aside for an upgrade: rather than
    // racing to reopen the moment we close, wait here for the next log.
    if (db === null) void connect();
    valve.processor(log);
  };
};
