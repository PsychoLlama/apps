import { defineAction } from '@lib/state';
import { advancedSettingsStore } from './store';

/** Mirror the resolved log filter pattern into the store. */
export const setLogFilter = defineAction(
  [advancedSettingsStore],
  (advanced, pattern: string) => {
    advanced.logFilter = pattern;
  },
);

/** Mirror the resolved experimental flag into the store. */
export const setExperimentalEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.experimentalEnabled = enabled;
  },
);
