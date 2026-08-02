/**
 * Fold tests for the launcher flags: commit a fact, assert the state it
 * lands. No sagas and no capabilities are involved — what publishes each
 * fact is covered by the saga tests.
 */

import { createTestRuntime } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import {
  launcherFlagsRestoredTopic,
  launcherFlagsStore,
  scratchpadChangedTopic,
} from '../flags';
import { launcherScope } from '../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(launcherScope);
  return runtime;
};

describe('launcherFlagsStore', () => {
  it("starts on the active environment's built-in defaults", () => {
    const { peek } = setup();

    // Seeding from the defaults is what keeps prerender and the client's
    // first paint in agreement — the OPFS override arrives later.
    expect(peek(launcherFlagsStore)).toEqual({
      scratchpadEnabled: scratchpadAppEnabled.defaults[environment].enabled,
    });
  });

  it('takes every resolved flag at once', () => {
    const { commit, peek } = setup();

    commit(launcherFlagsRestoredTopic({ scratchpadEnabled: true }));

    expect(peek(launcherFlagsStore)).toEqual({ scratchpadEnabled: true });
  });

  it('takes a scratchpad flag change on its own', () => {
    const { commit, peek } = setup();
    commit(launcherFlagsRestoredTopic({ scratchpadEnabled: false }));

    commit(scratchpadChangedTopic(true));

    expect(peek(launcherFlagsStore)).toEqual({ scratchpadEnabled: true });
  });
});
