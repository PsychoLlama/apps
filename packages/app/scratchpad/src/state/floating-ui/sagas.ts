import { call, commit, defineSaga } from '@lib/state';
import {
  readTetherEnabled,
  resetTetherEnabled,
  watchTetherEnabled,
  writeTetherEnabled,
} from './capabilities';
import { controlsReset, tetherEnabledChanged } from './controls';
import { scratchpadScope } from './scope';

/**
 * Bring the persisted tether toggle to life and keep it there. Opens the
 * change subscription, reconciles the seeded default with whatever OPFS
 * has persisted, then publishes every later change for as long as the
 * scope lives. This is the only writer of `tetherEnabled`: the sagas
 * below persist through `@lib/runtime-config`, and the change comes back
 * around here.
 *
 * The route runs it once on mount — OPFS is client-only, so it can't run
 * during SSG.
 *
 * Order matters. Subscribing before the read means a change landing
 * mid-read is buffered rather than lost; draining after the restore means
 * it's replayed on top of the snapshot instead of being clobbered by it.
 *
 * It never ends on its own. Releasing the last anchor aborts it, which
 * drops the subscription.
 */
export const trackTetherConfigSaga = defineSaga(
  scratchpadScope,
  async function* () {
    const changes = yield* call(watchTetherEnabled);

    const enabled = yield* call(readTetherEnabled);
    yield commit(tetherEnabledChanged(enabled));

    for await (const change of changes) {
      yield commit(tetherEnabledChanged(change));
    }
  },
);

/**
 * Persist the tether toggle. Publishes nothing: the write echoes back
 * through the subscription, which is what updates the store.
 */
export const commitTetherEnabledSaga = defineSaga(
  scratchpadScope,
  async function* (enabled: boolean) {
    yield* call(writeTetherEnabled, enabled);
  },
);

/**
 * Put every control back to its default and clear the tether override
 * along with them, so the one persisted control resets like the rest
 * rather than surviving the button that claims to reset everything.
 *
 * The commit lands first for an immediate reset; the override clears
 * behind it and echoes back the same value.
 */
export const resetControlsSaga = defineSaga(
  scratchpadScope,
  async function* () {
    yield commit(controlsReset());
    yield* call(resetTetherEnabled);
  },
);
