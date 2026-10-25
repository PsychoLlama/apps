import { collect, pipe, reactive } from '@lib/effects';
import { createCell, defineCommand } from '@lib/state';
import {
  MOTION_IDS,
  MOTION_STORAGE_KEY,
  type MotionOption,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';

// An unset or unrecognized value reads as `'system'`.
const parse = (stored: string | null): MotionOption =>
  MOTION_IDS.find((id) => id === stored) ?? 'system';

/**
 * The full/reduced/system motion preference, hydrated from storage and
 * kept in step with other tabs. Client-only; it reads `localStorage`.
 */
export const $motion = pipe([
  () => {
    const [motion, setMotion] = createCell(
      parse(localStorage.getItem(MOTION_STORAGE_KEY)),
    );

    return reactive(motion, watchStorage(MOTION_STORAGE_KEY, parse, setMotion));
  },
]);

/** The motion preference changed. */
export const $motionChanged = defineCommand(
  [$motion],
  ([, setMotion]) =>
    (motion: MotionOption) =>
      setMotion(motion),
);

/**
 * Switch the motion preference, then persist it. `'system'` clears
 * storage. Storage that refuses access is skipped. Storage goes last: if
 * it fails otherwise, the switch still shows.
 */
export const $setMotion = collect(
  [$motionChanged],
  (motionChanged) => (motion: MotionOption) => {
    motionChanged(motion);

    if (motion === 'system') removeItem(MOTION_STORAGE_KEY);
    else setItem(MOTION_STORAGE_KEY, motion);
  },
);
