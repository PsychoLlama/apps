/**
 * Behavioral tests for the IndexedDB backend. IndexedDB is real (provided by
 * Chromium), driven through a real `@holz/core` logger so the tests exercise
 * the same path production code takes: `logger.info(...)` → processor → store.
 */

import { openDB } from 'idb';
import { createLogger, level, type Log, type Logger } from '@holz/core';

import { createIdbBackend, type LogDatabase } from '../holz-idb-backend';

// The on-disk contract this backend promises, pinned independently of the
// source. A rename there has to break these too — a deliberate, reviewed change
// rather than a silent migration.
const DATABASE_NAME = '@holz';
const STORE_NAME = 'logs';
const TIMESTAMP_INDEX = 'by-timestamp';

/** Reads every persisted log back in insertion (key) order. */
const readPersistedLogs = async (): Promise<Log[]> => {
  const db = await openDB<LogDatabase>(DATABASE_NAME);
  try {
    return await db.getAll(STORE_NAME);
  } finally {
    db.close();
  }
};

/** Reads persisted logs back in event-time order via the timestamp index. */
const readLogsByTimestamp = async (): Promise<Log[]> => {
  const db = await openDB<LogDatabase>(DATABASE_NAME);
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
  // Build the backend first so the database and its store exist, then wipe the
  // store so each test starts empty. Clearing is a plain transaction — unlike
  // `deleteDB`, it raises no `versionchange`, so it neither disturbs nor waits
  // on any other open connection.
  logger = createLogger(await createIdbBackend());

  const db = await openDB<LogDatabase>(DATABASE_NAME);
  try {
    await db.clear(STORE_NAME);
  } finally {
    db.close();
  }
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
  const db = await openDB(DATABASE_NAME);
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
