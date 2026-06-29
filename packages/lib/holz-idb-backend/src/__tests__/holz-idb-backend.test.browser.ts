/**
 * Behavioral tests for the IndexedDB backend. IndexedDB is real (provided by
 * Chromium), driven through a real `@holz/core` logger so the tests exercise
 * the same path production code takes: `logger.info(...)` → processor → store.
 */

import { openDB } from 'idb';
import { createLogger, level, type Log, type Logger } from '@holz/core';

import { createIdbBackend } from '../holz-idb-backend';
import {
  DATABASE_NAME,
  STORE_NAME,
  TIMESTAMP_INDEX,
  openLogDatabase,
} from '../database';

/** Reads every persisted log back in insertion (key) order. */
const readPersistedLogs = async (): Promise<Log[]> => {
  const db = await openLogDatabase();
  try {
    return await db.getAll(STORE_NAME);
  } finally {
    db.close();
  }
};

/** Reads persisted logs back in event-time order via the timestamp index. */
const readLogsByTimestamp = async (): Promise<Log[]> => {
  const db = await openLogDatabase();
  try {
    return await db.getAllFromIndex(STORE_NAME, TIMESTAMP_INDEX);
  } finally {
    db.close();
  }
};

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

let logger: Logger;

beforeEach(async () => {
  // The backend opens IndexedDB eagerly but asynchronously and returns its
  // processor synchronously. Drive one log through and wait for it to land —
  // proving the store exists and the connection is live — then wipe the store
  // so each test starts empty. Clearing is a plain transaction: unlike
  // `deleteDB`, it raises no `versionchange`, so it neither disturbs nor waits
  // on any other open connection.
  logger = createLogger(createIdbBackend());

  logger.info('warm-up');
  await vi.waitFor(async () => {
    expect(await readPersistedLogs()).not.toHaveLength(0);
  });

  const db = await openLogDatabase();
  try {
    await db.clear(STORE_NAME);
  } finally {
    db.close();
  }
});

it('buffers logs emitted before the database finishes opening', async () => {
  // A fresh backend opens IndexedDB asynchronously. Logs emitted in the same
  // tick — before the connection is live — must buffer and flush once it opens
  // rather than drop on the floor.
  const eager = createLogger(createIdbBackend());
  eager.info('emitted before open');

  const logs = await vi.waitFor(async () => {
    const persisted = await readPersistedLogs();
    expect(persisted).toHaveLength(1);
    return persisted;
  });

  expect(logs[0].message).toBe('emitted before open');
});

it('keeps writing across a schema upgrade triggered elsewhere', async () => {
  // The backend from `beforeEach` holds an open connection. Persist a log
  // through it, then force a version bump from a separate connection. That
  // fires `versionchange` on the backend's connection, which must close to let
  // the upgrade through and reconnect at the new version — not go dark.
  logger.info('before upgrade');
  await vi.waitFor(async () => {
    expect(await readPersistedLogs()).toContainEqual(
      expect.objectContaining({ message: 'before upgrade' }),
    );
  });

  // Open at a higher version, adding a throwaway index. This blocks until the
  // backend (and any other open connection) steps aside, then runs its upgrade.
  const upgraded = await openDB(DATABASE_NAME, 2, {
    upgrade(_db, _oldVersion, _newVersion, transaction) {
      transaction.objectStore(STORE_NAME).createIndex('by-level', 'level');
    },
  });
  upgraded.close();

  // The backend is now disconnected. The next log must lazily reconnect at
  // version 2 and persist, proving logging survived the upgrade.
  logger.info('after upgrade');
  await vi.waitFor(async () => {
    expect(await readPersistedLogs()).toContainEqual(
      expect.objectContaining({ message: 'after upgrade' }),
    );
  });
});

it('persists a log with its level, origin, and context', async () => {
  logger.namespace('worker').info('flushed batch', { count: 3 });

  // The write is fire-and-forget, so poll the store until it lands.
  const [log] = await vi.waitFor(async () => {
    const logs = await readPersistedLogs();
    expect(logs).toHaveLength(1);
    return logs;
  });

  expect(log).toMatchObject({
    message: 'flushed batch',
    level: level.info,
    origin: ['worker'],
    context: { count: 3 },
  });
  expect(typeof log.timestamp).toBe('number');
});

it('appends logs in the order they were emitted', async () => {
  logger.info('first');
  logger.warn('second');
  logger.error('third');

  const logs = await vi.waitFor(async () => {
    const persisted = await readPersistedLogs();
    expect(persisted).toHaveLength(3);
    return persisted;
  });

  expect(logs.map((log) => log.message)).toEqual(['first', 'second', 'third']);
  expect(logs.map((log) => log.level)).toEqual([
    level.info,
    level.warn,
    level.error,
  ]);
});

it('orders logs by event time through the timestamp index', async () => {
  // Stand in for interleaved contexts: a buffered producer flushes an older
  // log *after* a newer one has already been written. Insertion order and
  // event-time order diverge — the index is what recovers chronology.
  const db = await openLogDatabase();
  try {
    await db.add(STORE_NAME, makeLog({ message: 'newer', timestamp: 2000 }));
    await db.add(STORE_NAME, makeLog({ message: 'older', timestamp: 1000 }));
  } finally {
    db.close();
  }

  const byInsertion = await readPersistedLogs();
  const byTimestamp = await readLogsByTimestamp();

  expect(byInsertion.map((log) => log.message)).toEqual(['newer', 'older']);
  expect(byTimestamp.map((log) => log.message)).toEqual(['older', 'newer']);
});
