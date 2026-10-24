import { collect, pipe, reactive } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  MOTION_ATTRIBUTE,
  MOTION_IDS,
  MOTION_STORAGE_KEY,
  type MotionOption,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';

// An unset or unrecognized value reads as `'system'`.
const parse = (stored: string | null): MotionOption =>
  MOTION_IDS.find((id) => id === stored) ?? 'system';

// Hydrated from storage. Never hold it bare, or it never hears from
// other tabs.
const $motionCell = defineCell(() =>
  parse(localStorage.getItem(MOTION_STORAGE_KEY)),
);

/** The motion preference changed. */
export const $motionChanged = defineCommand(
  [$motionCell],
  ([, setMotion]) =>
    (motion: MotionOption) =>
      setMotion(motion),
);

const $motionSync = pipe([
  $motionChanged,
  watchStorage(MOTION_STORAGE_KEY, parse),
]);

/**
 * The full/reduced/system motion preference, hydrated from storage and
 * kept in step with other tabs. Client-only; it reads `localStorage`.
 */
export const $motion = collect([$motionCell, $motionSync], (motion) =>
  reactive(motion),
);

/**
 * Switch the motion preference: the cell, the `<html>` attribute, then
 * storage. `'system'` drops the attribute so media queries take over,
 * and clears storage. Storage that refuses access is skipped. Storage
 * goes last: if it fails otherwise, the switch still shows.
 */
export const $setMotion = collect(
  [$motionChanged],
  (motionChanged) => (motion: MotionOption) => {
    motionChanged(motion);

    const { dataset } = document.documentElement;
    if (motion === 'system') {
      delete dataset[MOTION_ATTRIBUTE];
      removeItem(MOTION_STORAGE_KEY);
    } else {
      dataset[MOTION_ATTRIBUTE] = motion;
      setItem(MOTION_STORAGE_KEY, motion);
    }
  },
);
