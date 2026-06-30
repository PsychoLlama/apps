import { defineAction } from '@lib/state';
import { advancedSettingsStore, type AdvancedSettingsState } from './store';

/**
 * Mirror every resolved Advanced setting into the store in one flush.
 * Used by the mount-time hydrate, which reads all options together.
 */
export const setAdvancedSettings = defineAction(
  [advancedSettingsStore],
  (advanced, values: AdvancedSettingsState) => {
    advanced.logFilter = values.logFilter;
    advanced.logExportEnabled = values.logExportEnabled;
    advanced.experimentalEnabled = values.experimentalEnabled;
    advanced.shareEnabled = values.shareEnabled;
  },
);

/** Mirror a resolved log filter pattern into the store. */
export const setLogFilter = defineAction(
  [advancedSettingsStore],
  (advanced, pattern: string) => {
    advanced.logFilter = pattern;
  },
);

/** Mirror a resolved logs export flag into the store. */
export const setLogExportEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.logExportEnabled = enabled;
  },
);

/** Mirror a resolved experimental flag into the store. */
export const setExperimentalEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.experimentalEnabled = enabled;
  },
);

/** Mirror a resolved share flag into the store. */
export const setShareEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.shareEnabled = enabled;
  },
);
