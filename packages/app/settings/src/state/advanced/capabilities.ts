import {
  environment,
  readEnvironment,
  subscribe,
  updateConfig,
  type Override,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { experimentalApp } from '@app/experimental/config';

/**
 * Resolve the log filter pattern for the active environment, layering any
 * persisted OPFS override over the default.
 */
export const readLogFilter = async (): Promise<string> =>
  (await readEnvironment(filter)).pattern;

/** Persist a new log filter pattern as the active environment's override. */
export const writeLogFilter = async (pattern: string): Promise<void> => {
  const patch: Override<{ pattern: string }> = { [environment]: { pattern } };
  await updateConfig(filter, patch);
};

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

/**
 * Resolve whether the experimental app is enabled for the active
 * environment, layering any persisted OPFS override over the default.
 */
export const readExperimentalEnabled = async (): Promise<boolean> =>
  (await readEnvironment(experimentalApp)).enabled;

/** Persist the experimental flag as the active environment's override. */
export const writeExperimentalEnabled = async (
  enabled: boolean,
): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = { [environment]: { enabled } };
  await updateConfig(experimentalApp, patch);
};

/**
 * Watch for experimental flag changes from any browsing context. Returns
 * an unsubscribe.
 */
export const watchExperimentalEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(experimentalApp, (value) => {
    onChange(value.enabled);
  });
