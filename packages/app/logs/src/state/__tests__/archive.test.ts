import { createTestController } from '@lib/effects/testing';
import { level } from '@lib/observability';
import { $archive, $archiveLoaded, type ArchivedLog } from '../archive';

/** A complete `ArchivedLog`, with only the fields a test cares about overridden. */
const makeLog = (overrides: Partial<ArchivedLog>): ArchivedLog => ({
  id: 0,
  timestamp: 0,
  message: '',
  level: level.info,
  origin: [],
  context: {},
  ...overrides,
});

describe('$archive', () => {
  it('starts empty', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);

    expect(archive).toEqual({ entries: [], pruned: null });
  });
});

describe('$archiveLoaded', () => {
  it('lands the snapshot', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const entries = [makeLog({ message: 'read' })];
    const pruned = { timestamp: 1_700_000_000_000, deleted: 2000 };

    archiveLoaded(entries, pruned);

    expect(archive).toEqual({ entries, pruned });
  });
});
