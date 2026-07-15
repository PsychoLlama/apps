import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as experimentalAppEnabled } from '@app/scratchpad/config';

/** Whether the experimental scratchpad surfaces in the launcher. */
export interface ExperimentalFlagState {
  /**
   * `true` when the experimental app is enabled for the active
   * environment. Seeded from the option's per-environment default so
   * prerender and the client's first paint agree (no hydration flash); a
   * client-only effect then reconciles it with any persisted OPFS
   * override.
   */
  enabled: boolean;
}

/** Source of truth for the launcher's experimental-app visibility. */
export const experimentalFlagStore = defineStore<ExperimentalFlagState>(() => ({
  enabled: experimentalAppEnabled.defaults[environment].enabled,
}));

/** Live, readonly view of the experimental flag. */
export const experimentalFlag = createStore(experimentalFlagStore);
