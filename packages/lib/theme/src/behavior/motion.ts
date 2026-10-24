import { collect, pipe, reactive } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  MOTION_IDS,
  MOTION_STORAGE_KEY,
  type MotionOption,
} from '../constants';
import { watchStorage } from './local-storage';

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
