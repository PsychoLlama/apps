import { createStore, defineStore } from '@lib/state';
import { CURRENT_ENVIRONMENT, experimentalOption } from '../flag';

/** Whether the experimental scratchpad is reachable in this environment. */
export interface ExperimentalFlagState {
  /**
   * `true` while the scratchpad should render; `false` swaps the route to a
   * 404. Seeded from the option default, then refined by any persisted
   * runtime override.
   */
  enabled: boolean;
}

export const experimentalFlagStore = defineStore<ExperimentalFlagState>(() => ({
  // Seed from the option's default so SSG and first paint resolve without
  // waiting on the async override read — no 404 flash, no hydration mismatch.
  enabled: experimentalOption.defaults[CURRENT_ENVIRONMENT].enabled,
}));

/** Live, readonly view of the experimental scratchpad's gate. */
export const experimentalFlag = createStore(experimentalFlagStore);
