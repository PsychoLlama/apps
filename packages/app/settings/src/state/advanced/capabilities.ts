import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  watchAll,
  type Override,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { type AdvancedSettingsState } from './settings';

/**
 * Resolve every Advanced setting for the active environment in one pass,
 * layering any persisted OPFS override over each option's default. Reads
 * run concurrently so hydration is a single round-trip.
 */
export const readAdvancedSettings =
  async (): Promise<AdvancedSettingsState> => {
    const [logFilter, scratchpad] = await Promise.all([
      readEnvironment(filter),
      readEnvironment(scratchpadAppEnabled),
    ]);

    return {
      logFilter: logFilter.pattern,
      scratchpadEnabled: scratchpad.enabled,
    };
  };

/** Persist a new log filter pattern as the active environment's override. */
export const writeLogFilter = async (
  _signal: AbortSignal,
  pattern: string,
): Promise<void> => {
  const patch: Override<{ pattern: string }> = { [environment]: { pattern } };
  await updateConfig(filter, patch);
};

/**
 * Clear the log filter override for the active environment only, reverting
 * it to the built-in default. Other environments keep their overrides.
 */
export const resetLogFilter = (): Promise<void> => reset(filter, [environment]);

/** Persist the scratchpad flag as the active environment's override. */
export const writeScratchpadEnabled = async (
  _signal: AbortSignal,
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

/** One Advanced option settling on a new resolved value. */
export type AdvancedSettingChange =
  | { option: 'logFilter'; pattern: string }
  | { option: 'scratchpad'; enabled: boolean };

/**
 * Watch every Advanced option at once, reporting each resolved value as it
 * lands. Changes from any browsing context arrive here — sibling tabs,
 * workers, and this tab's own writes alike, which is what makes the
 * subscription the single source of truth rather than one of two.
 *
 * See {@link watchAll} for the buffering and teardown guarantees the
 * stream carries.
 */
export const watchAdvancedSettings = (
  signal: AbortSignal,
): AsyncGenerator<AdvancedSettingChange> =>
  watchAll(signal, (push) => [
    subscribe(filter, ({ pattern }) => push({ option: 'logFilter', pattern })),
    subscribe(scratchpadAppEnabled, ({ enabled }) =>
      push({ option: 'scratchpad', enabled }),
    ),
  ]);
