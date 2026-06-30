/**
 * Behavioral tests for the ndjson log-export stream. IndexedDB is real
 * (provided by Chromium); logs are seeded straight into the store so the
 * stream reads the same shape production writes.
 */

import { createIdbBackend } from '@lib/holz-idb-backend';
import { STORE_NAME, openLogDatabase } from '@lib/holz-idb-backend/database';
import { level, type Log } from '@lib/observability';

import { NDJSON_CONTENT_TYPE, streamLogArchive } from '../logs-export';

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

/** Seed logs straight into the store, bypassing the async backend. */
const seedLogs = async (logs: Log[]): Promise<void> => {
  const db = await openLogDatabase();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const log of logs) void tx.store.add(log);
    await tx.done;
  } finally {
    db.close();
  }
};

/** Drain the streamed response into parsed logs, one per ndjson line. */
const readNdjson = async (response: Response): Promise<Log[]> => {
  const body = await response.text();
  return body
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Log);
};

beforeEach(async () => {
  // `createIdbBackend` synchronously registers its versioned open, creating the
  // store on a fresh origin before the no-version open below runs (the backend's
  // own tests lean on the same ordering guarantee). Wipe it so each test starts
  // empty.
  createIdbBackend();

  const db = await openLogDatabase();
  try {
    await db.clear(STORE_NAME);
  } finally {
    db.close();
  }
});

it('streams the archive as ndjson, oldest-first', async () => {
  // Seed out of event-time order: chronology must fall out of the timestamp
  // index, not insertion order.
  await seedLogs([
    makeLog({ message: 'newer', timestamp: 2000 }),
    makeLog({ message: 'older', timestamp: 1000 }),
  ]);

  const response = streamLogArchive();
  expect(response.headers.get('Content-Type')).toBe(NDJSON_CONTENT_TYPE);

  const logs = await readNdjson(response);
  expect(logs.map((log) => log.message)).toEqual(['older', 'newer']);
});

it('preserves each log in full', async () => {
  await seedLogs([
    makeLog({
      message: 'flushed batch',
      level: level.warn,
      origin: ['worker'],
      context: { count: 3 },
      timestamp: 1234,
    }),
  ]);

  const [log] = await readNdjson(streamLogArchive());
  expect(log).toEqual({
    message: 'flushed batch',
    level: level.warn,
    origin: ['worker'],
    context: { count: 3 },
    timestamp: 1234,
  });
});

it('streams an empty body when no logs are stored', async () => {
  expect(await streamLogArchive().text()).toBe('');
});

it('offers the stream as a file download', () => {
  const response = streamLogArchive();
  expect(response.headers.get('Content-Disposition')).toBe(
    'attachment; filename="logs.ndjson"',
  );
});
