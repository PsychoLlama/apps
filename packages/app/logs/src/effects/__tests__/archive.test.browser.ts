/**
 * IndexedDB is real (provided by Chromium), so these run the same reads the
 * viewer does in production.
 */

import { createTestController } from '@lib/effects/testing';
import { level, type Log } from '@lib/observability';
import { STORE_NAME, openLogDatabase } from '@lib/holz-idb-backend/database';
import { createIdbBackend } from '@lib/holz-idb-backend';
import { $archivedLogs } from '../archive';

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

const addLogs = async (...logs: Log[]) => {
  const db = await openLogDatabase();
  try {
    for (const log of logs) await db.add(STORE_NAME, log);
  } finally {
    db.close();
  }
};

beforeEach(async () => {
  // Instantiating the backend synchronously registers its versioned open —
  // which creates the store on a fresh origin — before this clear's
  // no-version open runs. Wipe the store so each test starts empty.
  createIdbBackend();

  const db = await openLogDatabase();
  try {
    await db.clear(STORE_NAME);
  } finally {
    db.close();
  }
});

describe('$archivedLogs', () => {
  it('reads the archive newest-first by event time', async () => {
    // Insertion order and event-time order diverge: the timestamp index is
    // what recovers chronology.
    await addLogs(
      makeLog({ message: 'newer', timestamp: 2000 }),
      makeLog({ message: 'older', timestamp: 1000 }),
    );
    await using effects = createTestController();

    const logs = await effects.run($archivedLogs);

    expect(logs.map((log) => log.message)).toEqual(['newer', 'older']);
  });
});
