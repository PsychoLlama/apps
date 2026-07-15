import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  type Override,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { logExport } from '@app/logs/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { enabled as beamAppEnabled } from '@app/beam/config';
import { type AdvancedSettingsState } from './store';

/**
 * Resolve every Advanced setting for the active environment in one pass,
 * layering any persisted OPFS override over each option's default. Reads
 * run concurrently so hydration is a single round-trip.
 */
export const readAdvancedSettings =
  async (): Promise<AdvancedSettingsState> => {
    const [logFilter, logExportFlag, scratchpad, beam] = await Promise.all([
      readEnvironment(filter),
      readEnvironment(logExport),
      readEnvironment(scratchpadAppEnabled),
      readEnvironment(beamAppEnabled),
    ]);

    return {
      logFilter: logFilter.pattern,
      logExportEnabled: logExportFlag.enabled,
      scratchpadEnabled: scratchpad.enabled,
      beamEnabled: beam.enabled,
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

/** Persist the logs export flag as the active environment's override. */
export const writeLogExportEnabled = async (
  enabled: boolean,
): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = { [environment]: { enabled } };
  await updateConfig(logExport, patch);
};

/**
 * Clear the logs export override for the active environment only, reverting
 * it to the built-in default. Other environments keep theirs.
 */
export const resetLogExportEnabled = (): Promise<void> =>
  reset(logExport, [environment]);

/**
 * Watch for logs export flag changes from any browsing context. Returns an
 * unsubscribe.
 */
export const watchLogExportEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(logExport, (value) => {
    onChange(value.enabled);
  });

/** Persist the scratchpad flag as the active environment's override. */
export const writeScratchpadEnabled = async (
  enabled: boolean,
): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = { [environment]: { enabled } };
  await updateConfig(scratchpadAppEnabled, patch);
};

/**
 * Clear the scratchpad flag override for the active environment only,
 * reverting it to the built-in default. Other environments keep theirs.
 */
export const resetScratchpadEnabled = (): Promise<void> =>
  reset(scratchpadAppEnabled, [environment]);

/**
 * Watch for scratchpad flag changes from any browsing context. Returns
 * an unsubscribe.
 */
export const watchScratchpadEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(scratchpadAppEnabled, (value) => {
    onChange(value.enabled);
  });

/** Persist the beam flag as the active environment's override. */
export const writeBeamEnabled = async (enabled: boolean): Promise<void> => {
  const patch: Override<{ enabled: boolean }> = { [environment]: { enabled } };
  await updateConfig(beamAppEnabled, patch);
};

/**
 * Clear the beam flag override for the active environment only, reverting
 * it to the built-in default. Other environments keep theirs.
 */
export const resetBeamEnabled = (): Promise<void> =>
  reset(beamAppEnabled, [environment]);

/**
 * Watch for beam flag changes from any browsing context. Returns an
 * unsubscribe.
 */
export const watchBeamEnabled = (
  onChange: (enabled: boolean) => void,
): (() => void) =>
  subscribe(beamAppEnabled, (value) => {
    onChange(value.enabled);
  });
