/**
 * IndexedDB is real (provided by Chromium), so these run the same reads the
 * viewer does in production.
 */

import { createTestController } from '@lib/effects/testing';
import { deleteDatabase, openDatabase } from '@lib/holz-idb-backend/database';
import { level, type Log } from '@lib/observability';
import { LOGS_DATABASE } from '@lib/observability/storage';
import { wrap } from 'idb';
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
  const db = wrap(await openDatabase(LOGS_DATABASE));
  try {
    for (const log of logs) await db.add(LOGS_DATABASE.table, log);
  } finally {
    db.close();
  }
};

afterEach(async () => {
  await deleteDatabase(LOGS_DATABASE.name);
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

  it('reads nothing from a fresh origin', async () => {
    await using effects = createTestController();

    const logs = await effects.run($archivedLogs);

    expect(logs).toEqual([]);
  });
});
