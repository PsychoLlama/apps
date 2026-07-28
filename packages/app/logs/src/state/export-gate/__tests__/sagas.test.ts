/**
 * Saga tests for the export gate. `trackExportGateSaga` gets both treatments:
 * `simulate` for the facts it publishes and their order, a test runtime for
 * the state they land on. Every stubbed stream here is finite, which is what
 * lets the saga return; the real one only ends when the scope dies.
 */

import { createTestRuntime, simulate } from '@lib/state-next';
import {
  readExportGate,
  watchExportGate,
  type ExportGateChange,
} from '../capabilities';
import {
  exportFlagChangedTopic,
  exportGateRestoredTopic,
  exportGateStore,
  workerControlChangedTopic,
  type ExportGateState,
} from '../gate';
import { trackExportGateSaga } from '../sagas';
import { logsScope } from '../../scope';

const persisted: ExportGateState = { enabled: true, controlled: true };

/** A finite stand-in for the live subscription. */
const streamOf = async function* (
  changes: readonly ExportGateChange[],
): AsyncGenerator<ExportGateChange> {
  yield* changes;
};

describe('trackExportGateSaga', () => {
  it('opens the subscription before it reads', async () => {
    const order: string[] = [];

    await simulate(trackExportGateSaga(), {
      calls: [
        [
          watchExportGate,
          () => {
            order.push('watch');
            return streamOf([]);
          },
        ],
        [
          readExportGate,
          () => {
            order.push('read');
            return persisted;
          },
        ],
      ],
    });

    // Subscribing first is what keeps a change landing mid-read from being
    // lost rather than buffered.
    expect(order).toEqual(['watch', 'read']);
  });

  it('publishes the resolved conditions before any later change', async () => {
    const trace = await simulate(trackExportGateSaga(), {
      calls: [
        [watchExportGate, () => streamOf([{ source: 'flag', enabled: false }])],
        [readExportGate, () => persisted],
      ],
    });

    expect(trace.commits).toEqual([
      [exportGateRestoredTopic(persisted)],
      [exportFlagChangedTopic(false)],
    ]);
  });

  it('translates each change into its own fact', async () => {
    const trace = await simulate(trackExportGateSaga(), {
      calls: [
        [
          watchExportGate,
          () =>
            streamOf([
              { source: 'worker', controlled: false },
              { source: 'flag', enabled: false },
            ]),
        ],
        [readExportGate, () => persisted],
      ],
    });

    expect(trace.commits.slice(1)).toEqual([
      [workerControlChangedTopic(false)],
      [exportFlagChangedTopic(false)],
    ]);
  });

  it('replays a change that landed mid-read on top of the snapshot', async () => {
    const runtime = createTestRuntime({
      calls: [
        [
          watchExportGate,
          () => streamOf([{ source: 'worker', controlled: false }]),
        ],
        [readExportGate, () => persisted],
      ],
    });
    runtime.anchor(logsScope);

    await runtime.run(trackExportGateSaga());

    // The stream drains after the restore, so the later handoff wins rather
    // than being clobbered by the snapshot it raced.
    expect(runtime.peek(exportGateStore)).toEqual({
      enabled: true,
      controlled: false,
    });
  });
});
