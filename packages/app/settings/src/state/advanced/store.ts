import { createStore, defineStore } from '@lib/state';
import { environment } from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { experimentalApp } from '@app/experimental/config';

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
   * Whether the experimental app is enabled for the active environment.
   * Seeded from the option default, then reconciled on mount like
   * `logFilter`.
   */
  experimentalEnabled: boolean;
}

/** Source of truth for the Advanced settings controls. */
export const advancedSettingsStore = defineStore<AdvancedSettingsState>(() => ({
  logFilter: filter.defaults[environment].pattern,
  experimentalEnabled: experimentalApp.defaults[environment].enabled,
}));

/** Live, readonly view of the Advanced settings. */
export const advancedSettings = createStore(advancedSettingsStore);
