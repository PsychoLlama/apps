import { defineAction } from '#state';
import { timerStore } from './store';

/** Called once per second. Advances elapsed when running; no-op otherwise. */
export const tick = defineAction([timerStore], (timer) => {
  if (timer.running) {
    timer.elapsed += 1;
  }
});
