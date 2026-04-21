import { defineAction } from '#state/next';
import { timerStore } from './store';

/** Mark the timer as running and zero the elapsed counter. */
export const startTimer = defineAction([timerStore], (timer) => {
  timer.running = true;
  timer.elapsed = 0;
});

/** Freeze the timer without resetting elapsed. */
export const pauseTimer = defineAction([timerStore], (timer) => {
  timer.running = false;
});

/** Resume a paused timer. Preserves elapsed. */
export const resumeTimer = defineAction([timerStore], (timer) => {
  timer.running = true;
});

/** Stop the timer. Leaves elapsed at the current value for display. */
export const stopTimer = defineAction([timerStore], (timer) => {
  timer.running = false;
});

/** Called once per second. Advances elapsed when running; no-op otherwise. */
export const tick = defineAction([timerStore], (timer) => {
  if (timer.running) {
    timer.elapsed += 1;
  }
});
