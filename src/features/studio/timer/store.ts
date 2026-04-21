import { createStore, defineStore } from '#state';

/** Elapsed-time counter driving the studio's recording display. */
export interface TimerState {
  /** `true` while `tick` should advance `elapsed`. */
  running: boolean;
  /** Seconds accumulated since the current run started. */
  elapsed: number;
}

export const timerStore = defineStore<TimerState>(() => ({
  running: false,
  elapsed: 0,
}));

// Self-bootstrap so module imports give callers a live readonly view.
export const timer = createStore(timerStore);
