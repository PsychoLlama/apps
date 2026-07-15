import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { logExport } from '@app/logs/config';
import { enabled as experimentalAppEnabled } from '@app/scratchpad/config';
import { enabled as beamAppEnabled } from '@app/beam/config';

/** Live values backing the settings page's Advanced section. */
export interface AdvancedSettingsState {
  /**
   * Pattern gating which logs reach the browser console
   * (`@holz/pattern-filter` syntax). Seeded from the option's
   * per-environment default so prerender and the client's first paint
   * agree; a client-only effect then reconciles it with any persisted
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
   * Whether the experimental app is enabled for the active environment.
   * Seeded from the option default, then reconciled on mount like
   * `logFilter`.
   */
  experimentalEnabled: boolean;

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
  experimentalEnabled: experimentalAppEnabled.defaults[environment].enabled,
  beamEnabled: beamAppEnabled.defaults[environment].enabled,
};

/** Source of truth for the Advanced settings controls. */
export const advancedSettingsStore = defineStore<AdvancedSettingsState>(() => ({
  ...advancedDefaults,
}));

/** Live, readonly view of the Advanced settings. */
export const advancedSettings = createStore(advancedSettingsStore);
