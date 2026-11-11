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

    expect(archive).toEqual({ entries: [] });
  });
});

describe('$archiveLoaded', () => {
  it('lands the snapshot', async () => {
    await using effects = createTestController();
    const archive = await effects.run($archive);
    const archiveLoaded = await effects.run($archiveLoaded);
    const entries = [makeLog({ message: 'read' })];

    archiveLoaded(entries);

    expect(archive).toEqual({ entries });
  });
});
