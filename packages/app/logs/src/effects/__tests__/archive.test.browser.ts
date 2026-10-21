/**
 * IndexedDB and `BroadcastChannel` are real (provided by Chromium), so these
 * run the same reads and pings the viewer does in production.
 */

import { createTestController } from '@lib/effects/testing';
import { level, type Log } from '@lib/observability';
import {
  PRUNE_RECORD_KEY,
  PRUNE_STORE_NAME,
  STORE_NAME,
  openLogDatabase,
} from '@lib/holz-idb-backend/database';
import { createLogInsertedChannel } from '@lib/holz-idb-backend/broadcast';
import { createIdbBackend } from '@lib/holz-idb-backend';
import { $refreshArchive, $trackedArchive } from '../archive';

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

/** Ping the insert channel, as the backend does when it persists logs. */
const ping = async () => {
  const channel = createLogInsertedChannel();
  try {
    await channel.send();
  } finally {
    channel.close();
  }
};

beforeEach(async () => {
  // Instantiating the backend synchronously registers its versioned open —
  // which creates the store on a fresh origin — before this clear's
  // no-version open runs. Wipe both stores so each test starts empty.
  createIdbBackend();

  const db = await openLogDatabase();
  try {
    await Promise.all([db.clear(STORE_NAME), db.clear(PRUNE_STORE_NAME)]);
  } finally {
    db.close();
  }
});

describe('$trackedArchive', () => {
  it('reads the archive newest-first by event time', async () => {
    // Insertion order and event-time order diverge: the timestamp index is
    // what recovers chronology.
    await addLogs(
      makeLog({ message: 'newer', timestamp: 2000 }),
      makeLog({ message: 'older', timestamp: 1000 }),
    );
    await using effects = createTestController();

    const archive = await effects.run($trackedArchive);

    expect(archive.freshness).toBe('current');
    expect(archive.entries.map((log) => log.message)).toEqual([
      'newer',
      'older',
    ]);
  });

  it('reads back the pruning record so the gap can be dated', async () => {
    const pruned = { timestamp: 1_700_000_000_000, deleted: 2000 };
    const writer = await openLogDatabase();
    try {
      await writer.put(PRUNE_STORE_NAME, pruned, PRUNE_RECORD_KEY);
    } finally {
      writer.close();
    }
    await using effects = createTestController();

    const archive = await effects.run($trackedArchive);

    expect(archive.pruned).toEqual(pruned);
  });

  it('reports nothing pruned when no pass has ever run', async () => {
    await using effects = createTestController();

    const archive = await effects.run($trackedArchive);

    expect(archive.pruned).toBeNull();
  });

  it('flags the archive stale when the backend pings', async () => {
    await using effects = createTestController();
    const archive = await effects.run($trackedArchive);

    await ping();

    await expect.poll(() => archive.freshness).toBe('stale');
  });
});

describe('$refreshArchive', () => {
  it('reads only logs newer than the held snapshot', async () => {
    await addLogs(makeLog({ message: 'held', timestamp: 2000 }));
    await using effects = createTestController();
    const archive = await effects.run($trackedArchive);
    const refresh = await effects.run($refreshArchive);

    // One newer, one back-dated below the floor. Only the newer crosses the
    // exclusive lower bound.
    await addLogs(
      makeLog({ message: 'newer', timestamp: 3000 }),
      makeLog({ message: 'backdated', timestamp: 1500 }),
    );
    await refresh();

    expect(archive.entries.map((log) => log.message)).toEqual([
      'newer',
      'held',
    ]);
  });

  it('reads the whole archive when the snapshot holds nothing', async () => {
    await using effects = createTestController();
    const archive = await effects.run($trackedArchive);
    const refresh = await effects.run($refreshArchive);

    await addLogs(
      makeLog({ message: 'older', timestamp: 1000 }),
      makeLog({ message: 'newer', timestamp: 2000 }),
    );
    await refresh();

    expect(archive.entries.map((log) => log.message)).toEqual([
      'newer',
      'older',
    ]);
  });
});
