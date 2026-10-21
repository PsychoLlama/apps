import { collect } from '@lib/effects';
import {
  readOnboarding,
  saveOnboarding,
  type OnboardingStep,
} from '../platform/database';
import {
  $onboarding,
  $onboardingAdvanced,
  $onboardingRestored,
  normalizeLabel,
} from '../state';
import { $nameDevice } from './identity';

// Move to a step and write it through: commit first, persist after. One clock
// reading for both, so disk and memory agree about when it happened.
const advance = async (
  onboardingAdvanced: (record: {
    step: OnboardingStep;
    updatedAt: number;
  }) => void,
  step: OnboardingStep,
) => {
  const record = { step, updatedAt: Date.now() };
  onboardingAdvanced(record);
  await saveOnboarding(record);
};

/**
 * Load this device's setup progress. Client-only, so the layout holds it
 * from mount.
 */
export const $restoreOnboarding = collect(
  [$onboardingRestored],
  async (onboardingRestored) => {
    onboardingRestored(await readOnboarding());
  },
);

/**
 * Finish step one: name this device, then move on.
 *
 * A blank is refused here rather than passed on: at the step whose whole
 * purpose is to collect a name, a blank field is an unanswered question.
 * Guarded on the step, so a stale submit from a screen that has already
 * moved on can't walk the device backwards.
 */
export const $finishNaming = collect(
  [$onboarding, $onboardingAdvanced, $nameDevice],
  (progress, onboardingAdvanced, nameDevice) => async (raw: string) => {
    if (progress.step !== 'naming') return;

    const label = normalizeLabel(raw);
    if (!label) return;

    if (await nameDevice(label)) await advance(onboardingAdvanced, 'pairing');
  },
);

/**
 * Finish step two: this device has met another one, in either direction.
 * Meeting a device is what step two asks for, so it ends by being answered
 * rather than dismissed. A no-op on any other step.
 */
export const $finishPairing = collect(
  [$onboarding, $onboardingAdvanced],
  (progress, onboardingAdvanced) => async () => {
    if (progress.step === 'pairing') await advance(onboardingAdvanced, 'done');
  },
);
