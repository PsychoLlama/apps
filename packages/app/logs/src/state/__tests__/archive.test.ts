import { createTestController } from '@lib/effects/testing';
import { level, type Log } from '@lib/observability';
import {
  $archive,
  $archiveLoaded,
  $archiveRefreshed,
  $logsInserted,
} from '../archive';

/** A complete `Log`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<Log>): Log => ({
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

describe('$archive', () => {
  it('starts with nothing to compare against', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);

    expect(archive).toEqual({
      freshness: 'initial',
      entries: [],
      pruned: null,
    });
  });
});

describe('$archiveLoaded', () => {
  it('lands the snapshot as current', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const entries = [makeLog({ message: 'read' })];
    const pruned = { timestamp: 1_700_000_000_000, deleted: 2000 };

    archiveLoaded(entries, pruned);

    expect(archive).toEqual({ freshness: 'current', entries, pruned });
  });

  it('lands back at current on a re-read', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const logsInserted = await effects.run($logsInserted);

    archiveLoaded([], null);
    logsInserted();
    archiveLoaded([], null);

    expect(archive.freshness).toBe('current');
  });
});

describe('$logsInserted', () => {
  it('flips a current archive to stale', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const logsInserted = await effects.run($logsInserted);

    archiveLoaded([], null);
    logsInserted();

    expect(archive.freshness).toBe('stale');
  });

  it('ignores pings before the first read lands', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const logsInserted = await effects.run($logsInserted);

    logsInserted();

    expect(archive.freshness).toBe('initial');
  });
});

describe('$archiveRefreshed', () => {
  it('prepends refreshed logs ahead of the held snapshot', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const logsInserted = await effects.run($logsInserted);
    const archiveRefreshed = await effects.run($archiveRefreshed);
    const held = makeLog({ message: 'held', timestamp: 1000 });
    const added = makeLog({ message: 'added', timestamp: 2000 });

    archiveLoaded([held], null);
    logsInserted();
    archiveRefreshed([added]);

    expect(archive.freshness).toBe('current');
    expect(archive.entries).toEqual([added, held]);
  });

  it('settles freshness to current when a refresh adds nothing', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const logsInserted = await effects.run($logsInserted);
    const archiveRefreshed = await effects.run($archiveRefreshed);
    const held = makeLog({ message: 'held' });

    archiveLoaded([held], null);
    logsInserted();
    archiveRefreshed([]);

    expect(archive.freshness).toBe('current');
    expect(archive.entries).toEqual([held]);
  });
});
