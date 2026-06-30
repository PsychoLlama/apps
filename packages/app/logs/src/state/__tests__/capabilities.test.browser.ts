/**
 * Behavioral tests for the log viewer's archive read. IndexedDB is real
 * (provided by Chromium), so these exercise the same cursor walk the viewer
 * runs in production: open a connection, iterate the timestamp index
 * newest-first.
 */

import { level, type Log } from '@lib/observability';
import { STORE_NAME, openLogDatabase } from '@lib/holz-idb-backend/database';
import { createIdbBackend } from '@lib/holz-idb-backend';

import { loadArchive } from '../capabilities';

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

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
