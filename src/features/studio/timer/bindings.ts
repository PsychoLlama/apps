import { defineAction } from '#state';
import { timerStore } from './store';

/**
 * Recompute `elapsed` against the wall clock. The caller passes
 * `Date.now()` so the action stays a pure read of state. No-op when
 * paused/stopped (`startedAt` is `null`).
 */
export const tick = defineAction([timerStore], (timer, now: number) => {
  if (timer.startedAt !== null) {
    timer.elapsed = Math.floor((now - timer.startedAt) / 1000);
  }
});
