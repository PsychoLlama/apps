import { call, commit, defineSaga, read } from '@lib/state';
import {
  onboardingAdvancedTopic,
  onboardingLoadFailedTopic,
  onboardingLoadingTopic,
  onboardingRestoredTopic,
  onboardingStore,
} from './progress';
import { readOnboarding, saveOnboarding } from './capabilities';
import { nameSelfSaga } from '../contacts';
import { now } from '../contacts/capabilities';
import type { OnboardingStep } from '../database';
import { beamScope } from '../scope';

/**
 * Move to a step and write it through. Commits first and persists after, like
 * every other change in beam, so the screen turns over on the same frame and
 * disk catches up behind it.
 *
 * The clock is read once and carried into both, so the record on disk and the
 * one in memory agree about when the step was finished.
 */
const advanceSaga = defineSaga(
  beamScope,
  async function* (step: OnboardingStep) {
    const updatedAt = yield* call(now);
    const record = { step, updatedAt };

    yield commit(onboardingAdvancedTopic(record));
    yield* call(saveOnboarding, record);
  },
);

/**
 * Load this device's setup progress into memory. `BeamLayout` runs it once as
 * the surface mounts — IndexedDB is client-only, so it can't run during SSG.
 *
 * Guarded on `initial` so a second anchor can't re-read the progress and drop
 * the reader back onto a step they've since finished.
 */
export const restoreOnboardingSaga = defineSaga(beamScope, async function* () {
  const { status } = yield* read(onboardingStore);
  if (status !== 'initial') return;

  yield commit(onboardingLoadingTopic());

  try {
    const record = yield* call(readOnboarding);
    yield commit(onboardingRestoredTopic(record));
  } catch {
    // Reported by the capability, which has the context to describe it.
    yield commit(onboardingLoadFailedTopic());
  }
});

/**
 * Finish step one: name this device, then move on.
 *
 * The name is the device's to accept or refuse — a field holding two spaces
 * is not a name — and the step only moves if it took. Otherwise the form
 * comes back, still holding what was typed.
 *
 * Guarded on the step rather than on the form, so a stale submit from a
 * screen that has already moved on can't walk the device backwards.
 */
export const finishNamingSaga = defineSaga(
  beamScope,
  async function* (name: string) {
    const { step } = yield* read(onboardingStore);
    if (step !== 'naming') return;

    const named = yield* nameSelfSaga(name);
    if (!named) return;

    yield* advanceSaga('pairing');
  },
);

/**
 * Finish step two: this device has met another one.
 *
 * Called wherever a peer is filed in the address book, in either direction —
 * dialling someone's beam link and having someone dial ours are the same
 * news here, which is the point. Meeting a device is what step two is asking
 * for, so it ends by being answered rather than by being dismissed.
 *
 * A no-op on any other step. Every later connection runs through here too,
 * and none of them is a setup step.
 */
export const finishPairingSaga = defineSaga(beamScope, async function* () {
  const { step } = yield* read(onboardingStore);
  if (step !== 'pairing') return;

  yield* advanceSaga('done');
});
