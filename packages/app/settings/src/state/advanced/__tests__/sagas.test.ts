/**
 * Saga tests for the Advanced section. The write sagas run under
 * `simulate` — no runtime, no state, just what each one called.
 *
 * `trackAdvancedSettingsSaga` gets both treatments: `simulate` for the
 * facts it publishes and their order, a test runtime for the state they
 * land on. Every stubbed stream here is finite, which is what lets the
 * saga return; the real one only ends when the scope dies.
 */

import { createTestRuntime, simulate } from '@lib/state-next';
import {
  readAdvancedSettings,
  resetBeamEnabled,
  resetLogExportEnabled,
  resetLogFilter,
  resetScratchpadEnabled,
  watchAdvancedSettings,
  writeBeamEnabled,
  writeLogExportEnabled,
  writeLogFilter,
  writeScratchpadEnabled,
  type AdvancedSettingChange,
} from '../capabilities';
import {
  commitBeamSaga,
  commitLogExportSaga,
  commitLogFilterSaga,
  commitScratchpadSaga,
  resetBeamSaga,
  resetLogExportSaga,
  resetLogFilterSaga,
  resetScratchpadSaga,
  trackAdvancedSettingsSaga,
} from '../sagas';
import { advancedSettingsScope } from '../scope';
import {
  advancedDefaults,
  advancedSettingsRestoredTopic,
  advancedSettingsStore,
  beamChangedTopic,
  logExportChangedTopic,
  logFilterChangedTopic,
  scratchpadChangedTopic,
  type AdvancedSettingsState,
} from '../settings';

const persisted: AdvancedSettingsState = {
  logFilter: 'app:*',
  logExportEnabled: !advancedDefaults.logExportEnabled,
  scratchpadEnabled: !advancedDefaults.scratchpadEnabled,
  beamEnabled: !advancedDefaults.beamEnabled,
};

/** A finite stand-in for the live subscription. */
const streamOf = async function* (
  changes: readonly AdvancedSettingChange[],
): AsyncGenerator<AdvancedSettingChange> {
  yield* changes;
};

describe('trackAdvancedSettingsSaga', () => {
  it('opens the subscription before it reads', async () => {
    const order: string[] = [];

    await simulate(trackAdvancedSettingsSaga(), {
      calls: [
        [
          watchAdvancedSettings,
          () => {
            order.push('watch');
            return streamOf([]);
          },
        ],
        [
          readAdvancedSettings,
          () => {
            order.push('read');
            return persisted;
          },
        ],
      ],
    });

    // Subscribing first is what makes a change landing mid-read
    // survivable: the stream buffers from the moment it's opened.
    expect(order).toEqual(['watch', 'read']);
  });

  it('replays a buffered change on top of the restore, not under it', async () => {
    const trace = await simulate(trackAdvancedSettingsSaga(), {
      calls: [
        [
          watchAdvancedSettings,
          () => streamOf([{ option: 'logFilter', pattern: 'app:*' }]),
        ],
        [readAdvancedSettings, () => persisted],
      ],
    });

    // Order is the whole point. A change that beat the read is newer than
    // the snapshot the read returned, so it has to land after it —
    // otherwise hydration silently reverts it.
    expect(trace.commits).toEqual([
      [advancedSettingsRestoredTopic(persisted)],
      [logFilterChangedTopic('app:*')],
    ]);
  });

  it('publishes each option change under its own fact', async () => {
    const trace = await simulate(trackAdvancedSettingsSaga(), {
      calls: [
        [
          watchAdvancedSettings,
          () =>
            streamOf([
              { option: 'logFilter', pattern: 'app:*' },
              { option: 'logExport', enabled: true },
              { option: 'scratchpad', enabled: false },
              { option: 'beam', enabled: true },
            ]),
        ],
        [readAdvancedSettings, () => ({ ...advancedDefaults })],
      ],
    });

    expect(trace.commits.slice(1)).toEqual([
      [logFilterChangedTopic('app:*')],
      [logExportChangedTopic(true)],
      [scratchpadChangedTopic(false)],
      [beamChangedTopic(true)],
    ]);
  });

  it('reconciles the seeded defaults with what OPFS had', async () => {
    const runtime = createTestRuntime({
      calls: [
        [watchAdvancedSettings, () => streamOf([])],
        [readAdvancedSettings, () => persisted],
      ],
    });
    runtime.anchor(advancedSettingsScope);

    await runtime.run(trackAdvancedSettingsSaga());

    expect(runtime.peek(advancedSettingsStore)).toEqual(persisted);
  });

  it('lands every reported change in the store', async () => {
    const runtime = createTestRuntime({
      calls: [
        [
          watchAdvancedSettings,
          () =>
            streamOf([
              { option: 'logFilter', pattern: 'app:*' },
              { option: 'logExport', enabled: true },
              { option: 'scratchpad', enabled: true },
              { option: 'beam', enabled: true },
            ]),
        ],
        [readAdvancedSettings, () => ({ ...advancedDefaults })],
      ],
    });
    runtime.anchor(advancedSettingsScope);

    await runtime.run(trackAdvancedSettingsSaga());

    expect(runtime.peek(advancedSettingsStore)).toEqual({
      logFilter: 'app:*',
      logExportEnabled: true,
      scratchpadEnabled: true,
      beamEnabled: true,
    });
  });

  it('reports an unreadable OPFS rather than swallowing it', async () => {
    const runtime = createTestRuntime({
      calls: [
        [watchAdvancedSettings, () => streamOf([])],
        [
          readAdvancedSettings,
          () => {
            throw new Error('OPFS is unavailable');
          },
        ],
      ],
    });
    runtime.anchor(advancedSettingsScope);

    await expect(runtime.run(trackAdvancedSettingsSaga())).rejects.toThrow(
      'OPFS is unavailable',
    );

    // The seeded defaults stand in rather than a half-applied read.
    expect(runtime.peek(advancedSettingsStore)).toEqual(advancedDefaults);
  });
});

describe('write sagas', () => {
  it.each([
    [
      'commitLogFilterSaga',
      commitLogFilterSaga('app:*'),
      writeLogFilter,
      'app:*',
    ],
    [
      'commitLogExportSaga',
      commitLogExportSaga(true),
      writeLogExportEnabled,
      true,
    ],
    [
      'commitScratchpadSaga',
      commitScratchpadSaga(false),
      writeScratchpadEnabled,
      false,
    ],
    ['commitBeamSaga', commitBeamSaga(true), writeBeamEnabled, true],
  ] as const)(
    '%s persists its value and commits nothing',
    async (_name, invocation, capability, value) => {
      const write = vi.fn();

      const trace = await simulate(invocation, {
        calls: [[capability, write]],
      });

      // Nothing is published here on purpose: the write echoes back through
      // the subscription, which is the store's only writer.
      expect(trace.commits).toEqual([]);
      expect(write).toHaveBeenCalledWith(expect.anything(), value);
    },
  );

  it.each([
    ['resetLogFilterSaga', resetLogFilterSaga(), resetLogFilter],
    ['resetLogExportSaga', resetLogExportSaga(), resetLogExportEnabled],
    ['resetScratchpadSaga', resetScratchpadSaga(), resetScratchpadEnabled],
    ['resetBeamSaga', resetBeamSaga(), resetBeamEnabled],
  ] as const)(
    '%s clears its override and commits nothing',
    async (_name, invocation, capability) => {
      const clear = vi.fn();

      const trace = await simulate(invocation, {
        calls: [[capability, clear]],
      });

      expect(trace.commits).toEqual([]);
      expect(clear).toHaveBeenCalledTimes(1);
    },
  );
});
