import { defineFold, defineStore, defineTopic } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { advancedSettingsScope } from './scope';

/** Live values backing the settings page's Advanced section. */
export interface AdvancedSettingsState {
  /**
   * Pattern gating which logs reach the browser console
   * (`@holz/pattern-filter` syntax). Seeded from the option's
   * per-environment default so prerender and the client's first paint
   * agree; a client-only saga then reconciles it with any persisted
   * OPFS override.
   */
  logFilter: string;

  /**
   * Whether the scratchpad app is enabled for the active environment.
   * Seeded from the option default, then reconciled on mount like
   * `logFilter`.
   */
  scratchpadEnabled: boolean;
}

/**
 * The active environment's built-in defaults — the values a reset reverts
 * each control to. A control sits at its default exactly when its live
 * value equals this, which is how the reset affordances decide whether to
 * disable themselves.
 */
export const advancedDefaults: AdvancedSettingsState = {
  logFilter: filter.defaults[environment].pattern,
  scratchpadEnabled: scratchpadAppEnabled.defaults[environment].enabled,
};

/**
 * Source of truth for the Advanced settings controls.
 *
 * Every fact it folds comes from the runtime-config subscription, never
 * from the control that triggered a change: a write echoes back through
 * the subscription, so sibling tabs and this one learn about it the same
 * way and can't disagree.
 */
export const advancedSettingsStore = defineStore<AdvancedSettingsState>(
  advancedSettingsScope,
  () => ({ ...advancedDefaults }),
);

/**
 * Every Advanced option was resolved together at mount, layering any
 * persisted OPFS override over the seeded defaults.
 */
export const advancedSettingsRestoredTopic =
  defineTopic<AdvancedSettingsState>();
defineFold(
  advancedSettingsRestoredTopic,
  [advancedSettingsStore],
  (advanced, values) => {
    advanced.logFilter = values.logFilter;
    advanced.scratchpadEnabled = values.scratchpadEnabled;
  },
);

/** The console log filter resolved to a new pattern. */
export const logFilterChangedTopic = defineTopic<string>();
defineFold(
  logFilterChangedTopic,
  [advancedSettingsStore],
  (advanced, pattern) => {
    advanced.logFilter = pattern;
  },
);

/** The scratchpad app flag resolved to a new value. */
export const scratchpadChangedTopic = defineTopic<boolean>();
defineFold(
  scratchpadChangedTopic,
  [advancedSettingsStore],
  (advanced, enabled) => {
    advanced.scratchpadEnabled = enabled;
  },
);
