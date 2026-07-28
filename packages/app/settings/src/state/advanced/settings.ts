import { defineFold, defineStore, defineTopic } from '@lib/state-next';
import { environment } from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { logExport } from '@app/logs/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { enabled as beamAppEnabled } from '@app/beam/config';
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
   * Whether the logs export action is enabled for the active environment.
   * Seeded from the option default, then reconciled on mount like
   * `logFilter`.
   */
  logExportEnabled: boolean;

  /**
   * Whether the scratchpad app is enabled for the active environment.
   * Seeded from the option default, then reconciled on mount like
   * `logFilter`.
   */
  scratchpadEnabled: boolean;

  /**
   * Whether the beam app is enabled for the active environment. Seeded
   * from the option default, then reconciled on mount like `logFilter`.
   */
  beamEnabled: boolean;
}

/**
 * The active environment's built-in defaults — the values a reset reverts
 * each control to. A control sits at its default exactly when its live
 * value equals this, which is how the reset affordances decide whether to
 * disable themselves.
 */
export const advancedDefaults: AdvancedSettingsState = {
  logFilter: filter.defaults[environment].pattern,
  logExportEnabled: logExport.defaults[environment].enabled,
  scratchpadEnabled: scratchpadAppEnabled.defaults[environment].enabled,
  beamEnabled: beamAppEnabled.defaults[environment].enabled,
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
    advanced.logExportEnabled = values.logExportEnabled;
    advanced.scratchpadEnabled = values.scratchpadEnabled;
    advanced.beamEnabled = values.beamEnabled;
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

/** The logs export flag resolved to a new value. */
export const logExportChangedTopic = defineTopic<boolean>();
defineFold(
  logExportChangedTopic,
  [advancedSettingsStore],
  (advanced, enabled) => {
    advanced.logExportEnabled = enabled;
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

/** The beam app flag resolved to a new value. */
export const beamChangedTopic = defineTopic<boolean>();
defineFold(beamChangedTopic, [advancedSettingsStore], (advanced, enabled) => {
  advanced.beamEnabled = enabled;
});
