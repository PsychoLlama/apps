import { defineCommand, defineStore } from '@lib/state';
import type { OnboardingRecord, OnboardingStep } from '../platform/database';

/**
 * Setting a device up: a name for it, and a first device to use it with.
 *
 * Progress through the two steps is persisted to its own table rather than
 * inferred from what the device happens to own. Owning things is what setup
 * *produces*, not what it is, and reading it backwards meant a device could
 * be walked through setup again by losing something.
 *
 * The name itself belongs to `identity` — it's this device's, and it
 * outlives the flow that first asks for it. What lives here is the asking:
 * which step we're on, and what the form is holding while it's filled in.
 */

/** How far setting this device up has got, as held in memory. */
export interface OnboardingProgress {
  /**
   * Which step the device is on. Starts at `naming` because that's what a
   * device nobody has touched is looking at — but it means nothing until the
   * disk has been consulted, which the layout waits on.
   */
  step: OnboardingStep;

  /**
   * When the device last finished a step, in epoch milliseconds, or `null` if
   * it has never finished one.
   */
  updatedAt: number | null;
}

/**
 * The half-filled setup form. Held here rather than in the field because the
 * form is torn down and rebuilt around it: leaving the step and coming back,
 * or a save that didn't land, should still have the name typed a moment ago.
 */
export interface SetupDraft {
  /**
   * The name typed into the setup form, exactly as typed. Unnormalized —
   * trimming under the caret would fight whoever is typing, and the rule that
   * decides what a name may be runs when the name is used.
   */
  name: string;
}

/**
 * How far setting this device up has got. IndexedDB is the durable copy; this
 * is the working one, loaded once per session and written through on every
 * change.
 */
export const $onboarding = defineStore<OnboardingProgress>(() => ({
  step: 'naming',
  updatedAt: null,
}));

/** What the setup form holds. */
export const $setupDraft = defineStore<SetupDraft>(() => ({ name: '' }));

/**
 * The persisted progress was read back — `null` where nothing was stored,
 * which is a device nobody has started setting up.
 */
export const $onboardingRestored = defineCommand(
  [$onboarding],
  (progress) => (record: OnboardingRecord | null) => {
    progress.step = record?.step ?? 'naming';
    progress.updatedAt = record?.updatedAt ?? null;
  },
);

/**
 * A step was finished and the device moved to the next one. Carries the
 * clock reading rather than taking one, so the record on disk and the one in
 * memory agree about when it happened.
 */
export const $onboardingAdvanced = defineCommand(
  [$onboarding],
  (progress) => (record: OnboardingRecord) => {
    progress.step = record.step;
    progress.updatedAt = record.updatedAt;
  },
);

/** The reader typed into the setup form. */
export const $setupNameChanged = defineCommand(
  [$setupDraft],
  (draft) => (name: string) => {
    draft.name = name;
  },
);
