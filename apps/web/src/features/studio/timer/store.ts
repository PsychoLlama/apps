import { createStore, defineStore } from '@lib/state';

/** Elapsed-time counter driving the studio's recording display. */
export interface TimerState {
  /** Seconds accumulated for the current recording run. */
  elapsed: number;
  /**
   * Wall-clock anchor (epoch ms) for the current run. `tick` derives
   * `elapsed` against it. `null` when the timer is paused or stopped —
   * `elapsed` then holds the captured value.
   */
  startedAt: number | null;
}

export const timerStore = defineStore<TimerState>(() => ({
  elapsed: 0,
  startedAt: null,
}));

// Self-bootstrap so module imports give callers a live readonly view.
export const timer = createStore(timerStore);
