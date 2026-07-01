/**
 * Behavioral tests for the log viewer's archive reads. IndexedDB is real
 * (provided by Chromium), so these exercise the same cursor walk the viewer
 * runs in production: open a connection, iterate the timestamp index
 * newest-first — either the whole store on first load or just the newer tail on
 * a refresh.
 */

import { level, type Log } from '@lib/observability';
import {
  STORE_NAME,
  openLogDatabase,
  type LogConnection,
} from '@lib/holz-idb-backend/database';
import { createIdbBackend } from '@lib/holz-idb-backend';
import type { DeepReadonly } from '@lib/state';

import { loadArchive, readNewLogs } from '../capabilities';
import type { LogsState } from '../store';

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
 * A minimal state view holding just what {@link readNewLogs} reads: the live
 * connection and the snapshot it reads forward from.
 */
const heldState = (
  db: LogConnection,
  entries: Log[] = [],
): DeepReadonly<LogsState> =>
  // `db` stands in for the held `Ref` — a branded type a plain object can't be
  // asserted to directly, so route the stub through `unknown`.
  ({ db: { current: db }, entries }) as unknown as DeepReadonly<LogsState>;

beforeEach(async () => {
  // Instantiating the backend synchronously registers its versioned open —
  // which creates the store on a fresh origin — before this clear's no-version
  // open runs. It opens at the current version when a peer has migrated past
  // ours, so it never fights another test file's schema. Wipe the store so each
  // test starts empty.
  createIdbBackend();

  const db = await openLogDatabase();
  try {
    await db.clear(STORE_NAME);
  } finally {
    db.close();
  }
});

describe('loadArchive', () => {
  it('reads the archive newest-first by event time', async () => {
    // Insertion order and event-time order diverge: a buffered producer lands an
    // older log *after* a newer one. The timestamp index is what recovers
    // chronology, and the `'prev'` cursor reads it back newest-first.
    const db = await openLogDatabase();
    try {
      await db.add(STORE_NAME, makeLog({ message: 'newer', timestamp: 2000 }));
      await db.add(STORE_NAME, makeLog({ message: 'older', timestamp: 1000 }));
    } finally {
      db.close();
    }

    const archive = await loadArchive();
    try {
      expect(archive.entries.map((log) => log.message)).toEqual([
        'newer',
        'older',
      ]);
    } finally {
      archive.db.close();
    }
  });

  it('resolves empty over an empty archive', async () => {
    const archive = await loadArchive();
    try {
      expect(archive.entries).toEqual([]);
    } finally {
      archive.db.close();
    }
  });

  it('hands back an open connection for the holder to keep', async () => {
    const archive = await loadArchive();
    try {
      // The returned connection is live, not closed once the read resolved: a
      // follow-up read goes straight through it without reopening.
      await expect(archive.db.getAll(STORE_NAME)).resolves.toEqual([]);
    } finally {
      archive.db.close();
    }
  });
});

describe('readNewLogs', () => {
  it('reads the whole archive when the snapshot holds nothing', async () => {
    const archive = await loadArchive();
    try {
      const writer = await openLogDatabase();
      try {
        await writer.add(
          STORE_NAME,
          makeLog({ message: 'older', timestamp: 1000 }),
        );
        await writer.add(
          STORE_NAME,
          makeLog({ message: 'newer', timestamp: 2000 }),
        );
      } finally {
        writer.close();
      }

      // An empty snapshot has no floor to read forward from, so it falls back to
      // the full read — newest-first, like the initial load.
      const added = await readNewLogs(heldState(archive.db, archive.entries));
      expect(added.map((log) => log.message)).toEqual(['newer', 'older']);
    } finally {
      archive.db.close();
    }
  });

  it('reads only logs newer than the held snapshot', async () => {
    const archive = await loadArchive();
    try {
      // The snapshot already holds an entry at t=2000. Two more land through a
      // separate connection: one newer, one back-dated below the floor. Only the
      // newer crosses the exclusive lower bound.
      const snapshot = [makeLog({ message: 'seen', timestamp: 2000 })];

      const writer = await openLogDatabase();
      try {
        await writer.add(
          STORE_NAME,
          makeLog({ message: 'newer', timestamp: 3000 }),
        );
        await writer.add(
          STORE_NAME,
          makeLog({ message: 'backdated', timestamp: 1500 }),
        );
      } finally {
        writer.close();
      }

      const added = await readNewLogs(heldState(archive.db, snapshot));
      expect(added.map((log) => log.message)).toEqual(['newer']);
    } finally {
      archive.db.close();
    }
  });

  it('rejects a refresh when no connection is held', async () => {
    const disconnected = { db: null } as DeepReadonly<LogsState>;
    await expect(readNewLogs(disconnected)).rejects.toThrow(
      /no archive connection/i,
    );
  });
});
