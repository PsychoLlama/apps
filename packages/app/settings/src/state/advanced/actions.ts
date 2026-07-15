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
    advanced.scratchpadEnabled = values.scratchpadEnabled;
    advanced.beamEnabled = values.beamEnabled;
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

/** Mirror a resolved scratchpad flag into the store. */
export const setScratchpadEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.scratchpadEnabled = enabled;
  },
);

/** Mirror a resolved beam flag into the store. */
export const setBeamEnabled = defineAction(
  [advancedSettingsStore],
  (advanced, enabled: boolean) => {
    advanced.beamEnabled = enabled;
  },
);
