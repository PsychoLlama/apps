import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as shareAppEnabled } from '@app/beam/config';

/** Whether the share app surfaces in the launcher. */
export interface ShareFlagState {
  /**
   * `true` when the share app is enabled for the active environment.
   * Seeded from the option's per-environment default so prerender and the
   * client's first paint agree (no hydration flash); a client-only effect
   * then reconciles it with any persisted OPFS override.
   */
  enabled: boolean;
}

/** Source of truth for the launcher's share-app visibility. */
export const shareFlagStore = defineStore<ShareFlagState>(() => ({
  enabled: shareAppEnabled.defaults[environment].enabled,
}));

/** Live, readonly view of the share flag. */
export const shareFlag = createStore(shareFlagStore);
