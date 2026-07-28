/**
 * Saga tests for the launcher flags. `trackLauncherFlagsSaga` gets both
 * treatments: `simulate` for the facts it publishes and their order, a
 * test runtime for the state they land on. Every stubbed stream here is
 * finite, which is what lets the saga return; the real one only ends when
 * the scope dies.
 */

import { createTestRuntime, simulate } from '@lib/state';
import {
  readLauncherFlags,
  watchLauncherFlags,
  type LauncherFlagChange,
} from '../capabilities';
import {
  beamChangedTopic,
  launcherFlagsRestoredTopic,
  launcherFlagsStore,
  scratchpadChangedTopic,
  type LauncherFlagsState,
} from '../flags';
import { trackLauncherFlagsSaga } from '../sagas';
import { launcherScope } from '../scope';

const persisted: LauncherFlagsState = {
  beamEnabled: true,
  scratchpadEnabled: true,
};

/** A finite stand-in for the live subscription. */
const streamOf = async function* (
  changes: readonly LauncherFlagChange[],
): AsyncGenerator<LauncherFlagChange> {
  yield* changes;
};

describe('trackLauncherFlagsSaga', () => {
  it('opens the subscription before it reads', async () => {
    const order: string[] = [];

    await simulate(trackLauncherFlagsSaga(), {
      calls: [
        [
          watchLauncherFlags,
          () => {
            order.push('watch');
            return streamOf([]);
          },
        ],
        [
          readLauncherFlags,
          () => {
            order.push('read');
            return persisted;
          },
        ],
      ],
    });

    // Subscribing first is what keeps a change landing mid-read from
    // being lost rather than buffered.
    expect(order).toEqual(['watch', 'read']);
  });

  it('publishes the persisted snapshot before any later change', async () => {
    const trace = await simulate(trackLauncherFlagsSaga(), {
      calls: [
        [watchLauncherFlags, () => streamOf([{ app: 'beam', enabled: false }])],
        [readLauncherFlags, () => persisted],
      ],
    });

    expect(trace.commits).toEqual([
      [launcherFlagsRestoredTopic(persisted)],
      [beamChangedTopic(false)],
    ]);
  });

  it('translates each change into its own fact', async () => {
    const trace = await simulate(trackLauncherFlagsSaga(), {
      calls: [
        [
          watchLauncherFlags,
          () =>
            streamOf([
              { app: 'scratchpad', enabled: false },
              { app: 'beam', enabled: false },
            ]),
        ],
        [readLauncherFlags, () => persisted],
      ],
    });

    expect(trace.commits.slice(1)).toEqual([
      [scratchpadChangedTopic(false)],
      [beamChangedTopic(false)],
    ]);
  });

  it('replays a change that landed mid-read on top of the snapshot', async () => {
    const runtime = createTestRuntime({
      calls: [
        [watchLauncherFlags, () => streamOf([{ app: 'beam', enabled: false }])],
        [readLauncherFlags, () => persisted],
      ],
    });
    runtime.anchor(launcherScope);

    await runtime.run(trackLauncherFlagsSaga());

    // The stream drains after the restore, so the later change wins
    // rather than being clobbered by the snapshot it raced.
    expect(runtime.peek(launcherFlagsStore)).toEqual({
      beamEnabled: false,
      scratchpadEnabled: true,
    });
  });
});
