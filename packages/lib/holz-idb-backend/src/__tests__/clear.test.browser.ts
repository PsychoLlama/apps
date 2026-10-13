import { level, type Log } from '@holz/core';

import { clearLogs } from '../clear';
import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  deleteLogDatabase,
  migrateLogDatabase,
  openLogDatabase,
} from '../database';

const createLog = (overrides: Partial<Log> = {}): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

describe('clearLogs', () => {
  afterEach(async () => {
    await deleteLogDatabase();
  });

  it('deletes every log and the prune record', async () => {
    const db = await migrateLogDatabase();
    const tx = db.transaction([STORE_NAME, PRUNE_STORE_NAME], 'readwrite');
    await Promise.all([
      tx.objectStore(STORE_NAME).add(createLog({ timestamp: 1 })),
      tx.objectStore(STORE_NAME).add(createLog({ timestamp: 2 })),
      tx
        .objectStore(PRUNE_STORE_NAME)
        .put({ timestamp: 3, deleted: 4 }, PRUNE_RECORD_KEY),
      tx.done,
    ]);
    db.close();

    await clearLogs();

    const reopened = await openLogDatabase();
    try {
      expect(await reopened.count(STORE_NAME)).toBe(0);
      expect(await reopened.count(PRUNE_STORE_NAME)).toBe(0);
    } finally {
      reopened.close();
    }
  });

  it('succeeds while another connection is open', async () => {
    // Every context's backend holds a long-lived connection. Clearing must
    // not wait on them the way a database delete would.
    const backend = await migrateLogDatabase();
    try {
      await backend.add(STORE_NAME, createLog());
      await clearLogs();

      expect(await backend.count(STORE_NAME)).toBe(0);
    } finally {
      backend.close();
    }
  });

  it('creates the schema on a fresh origin', async () => {
    await clearLogs();

    const db = await openLogDatabase();
    try {
      expect([...db.objectStoreNames]).toEqual([STORE_NAME, PRUNE_STORE_NAME]);
    } finally {
      db.close();
    }
  });
});
