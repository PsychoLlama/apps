import { call, commit, defineSaga } from '@lib/state-next';
import { readLauncherFlags, watchLauncherFlags } from './capabilities';
import {
  beamChangedTopic,
  launcherFlagsRestoredTopic,
  scratchpadChangedTopic,
} from './flags';
import { launcherScope } from './scope';

/**
 * Bring the launcher's gated app cards to life and keep them there. Opens
 * the change subscription, reconciles the seeded defaults with whatever
 * OPFS has persisted, then publishes every later change for as long as
 * the scope lives. This is the store's only writer.
 *
 * `Launcher` runs it once on mount — OPFS is client-only, so it can't run
 * during SSG.
 *
 * Order matters. Subscribing before the read means a change landing
 * mid-read is buffered rather than lost; draining after the restore means
 * it's replayed on top of the snapshot instead of being clobbered by it.
 *
 * It never ends on its own. Releasing the last anchor aborts it, which
 * drops the subscriptions.
 */
export const trackLauncherFlagsSaga = defineSaga(
  launcherScope,
  async function* () {
    const changes = yield* call(watchLauncherFlags);

    const values = yield* call(readLauncherFlags);
    yield commit(launcherFlagsRestoredTopic(values));

    for await (const change of changes) {
      switch (change.app) {
        case 'beam':
          yield commit(beamChangedTopic(change.enabled));
          break;
        case 'scratchpad':
          yield commit(scratchpadChangedTopic(change.enabled));
          break;
      }
    }
  },
);
