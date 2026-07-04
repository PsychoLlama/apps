import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as beamAppEnabled } from '@app/beam/config';

/** Whether the beam app surfaces in the launcher. */
export interface BeamFlagState {
  /**
   * `true` when the beam app is enabled for the active environment.
   * Seeded from the option's per-environment default so prerender and the
   * client's first paint agree (no hydration flash); a client-only effect
   * then reconciles it with any persisted OPFS override.
   */
  enabled: boolean;
}

/** Source of truth for the launcher's beam-app visibility. */
export const beamFlagStore = defineStore<BeamFlagState>(() => ({
  enabled: beamAppEnabled.defaults[environment].enabled,
}));

/** Live, readonly view of the beam flag. */
export const beamFlag = createStore(beamFlagStore);
