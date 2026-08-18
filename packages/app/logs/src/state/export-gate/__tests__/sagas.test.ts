/**
 * Saga tests for the export gate. `trackExportGateSaga` gets both treatments:
 * `simulate` for the facts it publishes and their order, a test runtime for
 * the state they land on. Every stubbed stream here is finite, which is what
 * lets the saga return; the real one only ends when the scope dies.
 */

import { createTestRuntime, simulate } from '@lib/state';
import { isWorkerControlling, watchWorkerControl } from '../capabilities';
import { exportGateStore, workerControlChangedTopic } from '../gate';
import { trackExportGateSaga } from '../sagas';
import { logsScope } from '../../scope';

/** A finite stand-in for the live subscription. */
const streamOf = async function* (
  changes: readonly boolean[],
): AsyncGenerator<boolean> {
  yield* changes;
};

describe('trackExportGateSaga', () => {
  it('opens the subscription before it reads', async () => {
    const order: string[] = [];

    await simulate(trackExportGateSaga(), {
      calls: [
        [
          watchWorkerControl,
          () => {
            order.push('watch');
            return streamOf([]);
          },
        ],
        [
          isWorkerControlling,
          () => {
            order.push('read');
            return true;
          },
        ],
      ],
    });

    // Subscribing first is what keeps a handoff landing mid-read from being
    // lost rather than buffered.
    expect(order).toEqual(['watch', 'read']);
  });

  it('publishes the page controller before any later handoff', async () => {
    const trace = await simulate(trackExportGateSaga(), {
      calls: [
        [watchWorkerControl, () => streamOf([false])],
        [isWorkerControlling, () => true],
      ],
    });

    expect(trace.commits).toEqual([
      [workerControlChangedTopic(true)],
      [workerControlChangedTopic(false)],
    ]);
  });

  it('replays a handoff that landed mid-read on top of the snapshot', async () => {
    const runtime = createTestRuntime({
      calls: [
        [watchWorkerControl, () => streamOf([false])],
        [isWorkerControlling, () => true],
      ],
    });
    runtime.anchor(logsScope);

    await runtime.run(trackExportGateSaga());

    // The stream drains after the read, so the later handoff wins rather than
    // being clobbered by the snapshot it raced.
    expect(runtime.peek(exportGateStore)).toEqual({ controlled: false });
  });
});
