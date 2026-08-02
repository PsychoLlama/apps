import { defineFold, defineStore, defineTopic } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { launcherScope } from './scope';

/** Which gated apps surface in the launcher. */
export interface LauncherFlagsState {
  /**
   * `true` when the scratchpad app is enabled for the active environment.
   * Seeded from the option's per-environment default so prerender and the
   * client's first paint agree (no hydration flash); a client-only saga
   * then reconciles it with any persisted OPFS override.
   */
  scratchpadEnabled: boolean;
}

/**
 * Source of truth for the launcher's gated app cards.
 *
 * Every fact it folds comes from the runtime-config subscription, never
 * from the control that triggered a change: the settings page's toggles
 * persist through `@lib/runtime-config` and the change comes back around
 * here, so the launcher learns about a same-tab write exactly the way a
 * sibling tab does.
 */
export const launcherFlagsStore = defineStore<LauncherFlagsState>(
  launcherScope,
  () => ({
    scratchpadEnabled: scratchpadAppEnabled.defaults[environment].enabled,
  }),
);

/**
 * Every gated app was resolved together at mount, layering any persisted
 * OPFS override over the seeded defaults.
 */
export const launcherFlagsRestoredTopic = defineTopic<LauncherFlagsState>();
defineFold(
  launcherFlagsRestoredTopic,
  [launcherFlagsStore],
  (flags, values) => {
    flags.scratchpadEnabled = values.scratchpadEnabled;
  },
);

/** The scratchpad app flag resolved to a new value. */
export const scratchpadChangedTopic = defineTopic<boolean>();
defineFold(scratchpadChangedTopic, [launcherFlagsStore], (flags, enabled) => {
  flags.scratchpadEnabled = enabled;
});
