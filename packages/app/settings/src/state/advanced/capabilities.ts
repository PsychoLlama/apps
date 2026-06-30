import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  type Override,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { enabled as experimentalAppEnabled } from '@app/experimental/config';
import { type AdvancedSettingsState } from './store';

/**
 * Resolve every Advanced setting for the active environment in one pass,
 * layering any persisted OPFS override over each option's default. Reads
 * run concurrently so hydration is a single round-trip.
 */
export const readAdvancedSettings =
  async (): Promise<AdvancedSettingsState> => {
    const [logFilter, experimental] = await Promise.all([
      readEnvironment(filter),
      readEnvironment(experimentalAppEnabled),
    ]);

    return {
      logFilter: logFilter.pattern,
      experimentalEnabled: experimental.enabled,
    };
  };

/** Persist a new log filter pattern as the active environment's override. */
export const writeLogFilter = async (pattern: string): Promise<void> => {
  const patch: Override<{ pattern: string }> = { [environment]: { pattern } };
  await updateConfig(filter, patch);
};

/**
 * Clear the log filter override for the active environment only, reverting
 * it to the built-in default. Other environments keep their overrides.
 */
export const resetLogFilter = (): Promise<void> => reset(filter, [environment]);

/**
 * Watch for log filter changes from any browsing context — including
 * same-tab writes — reporting the resolved pattern. Returns an
 * unsubscribe.
 */
export const watchLogFilter = (
  onChange: (pattern: string) => void,
): (() => void) =>
  subscribe(filter, (value) => {
    onChange(value.pattern);
  });

/** Persist the experimental flag as the active environment's override. */
export const writeExperimentalEnabled = async (
  enabled: boolean,
): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = { [environment]: { enabled } };
  await updateConfig(experimentalAppEnabled, patch);
};

/**
 * Clear the experimental flag override for the active environment only,
 * reverting it to the built-in default. Other environments keep theirs.
 */
export const resetExperimentalEnabled = (): Promise<void> =>
  reset(experimentalAppEnabled, [environment]);

/**
 * Watch for experimental flag changes from any browsing context. Returns
 * an unsubscribe.
 */
export const watchExperimentalEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(experimentalAppEnabled, (value) => {
    onChange(value.enabled);
  });
