import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';

/** Whether the scratchpad surfaces in the launcher. */
export interface ScratchpadFlagState {
  /**
   * `true` when the scratchpad app is enabled for the active
   * environment. Seeded from the option's per-environment default so
   * prerender and the client's first paint agree (no hydration flash); a
   * client-only effect then reconciles it with any persisted OPFS
   * override.
   */
  enabled: boolean;
}

/** Source of truth for the launcher's scratchpad visibility. */
export const scratchpadFlagStore = defineStore<ScratchpadFlagState>(() => ({
  enabled: scratchpadAppEnabled.defaults[environment].enabled,
}));

/** Live, readonly view of the scratchpad flag. */
export const scratchpadFlag = createStore(scratchpadFlagStore);
