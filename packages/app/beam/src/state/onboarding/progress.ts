import { defineFold, defineStore, defineTopic } from '@lib/state';
import type { OnboardingRecord, OnboardingStep } from '../database';
import { beamScope } from '../scope';

/**
 * Where the persisted progress sits in its lifecycle. The same four states
 * every other persisted thing in beam has.
 *
 * - `initial` — the read hasn't been attempted. What prerender and first
 *   paint show, and the reason the surface renders nothing at all until this
 *   moves: picking a screen here would be guessing.
 * - `loading` — the read is in flight.
 * - `ready` — the step is in memory and authoritative.
 * - `failed` — IndexedDB was unreadable. Distinct from a `ready` device on
 *   step one, which is a device nobody has set up.
 */
export type OnboardingStatus = 'initial' | 'loading' | 'ready' | 'failed';

/** How far setting this device up has got, as held in memory. */
export interface OnboardingProgress {
  /** Where the persisted progress sits in its lifecycle. */
  status: OnboardingStatus;

  /**
   * Which step the device is on. Starts at `naming` because that's what a
   * device nobody has touched is looking at — but it means nothing until
   * {@link OnboardingProgress.status} says the disk has been consulted.
   */
  step: OnboardingStep;

  /**
   * When the device last finished a step, in epoch milliseconds, or `null` if
   * it has never finished one.
   */
  updatedAt: number | null;
}

/**
 * How far setting this device up has got. IndexedDB is the durable copy; this
 * is the working one, loaded once per session and written through on every
 * change.
 */
export const onboardingStore = defineStore<OnboardingProgress>(
  beamScope,
  () => ({ status: 'initial', step: 'naming', updatedAt: null }),
);

/** The read of the persisted progress got under way. */
export const onboardingLoadingTopic = defineTopic();
defineFold(onboardingLoadingTopic, [onboardingStore], (progress) => {
  progress.status = 'loading';
});

/**
 * The persisted progress was read back — `null` where nothing was stored,
 * which is a device nobody has started setting up.
 */
export const onboardingRestoredTopic = defineTopic<OnboardingRecord | null>();
defineFold(onboardingRestoredTopic, [onboardingStore], (progress, record) => {
  progress.status = 'ready';
  progress.step = record?.step ?? 'naming';
  progress.updatedAt = record?.updatedAt ?? null;
});

/** The persisted progress couldn't be read. */
export const onboardingLoadFailedTopic = defineTopic();
defineFold(onboardingLoadFailedTopic, [onboardingStore], (progress) => {
  progress.status = 'failed';
});

/**
 * A step was finished and the device moved to the next one.
 *
 * Carries the clock reading rather than taking one, because folds are pure
 * and this is the value that goes to disk — the record and the store have to
 * agree on when it happened, and two readings of `Date.now()` don't.
 *
 * Lands `ready` whatever the load did, for the same reason naming a device
 * does: a step the reader just finished is the truth about this device
 * however unreachable the disk was a moment ago.
 */
export const onboardingAdvancedTopic = defineTopic<OnboardingRecord>();
defineFold(onboardingAdvancedTopic, [onboardingStore], (progress, record) => {
  progress.status = 'ready';
  progress.step = record.step;
  progress.updatedAt = record.updatedAt;
});
