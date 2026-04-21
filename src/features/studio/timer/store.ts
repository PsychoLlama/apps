import { createStore, defineStore, GLOBAL_REGISTRY } from '#state';

export interface TimerState {
  running: boolean;
  elapsed: number;
}

export const timerStore = defineStore<TimerState>(() => ({
  running: false,
  elapsed: 0,
}));

// Self-bootstrap against the global registry so module imports give
// callers a live readonly view.
export const timer = createStore(GLOBAL_REGISTRY, timerStore);
