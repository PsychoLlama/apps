import {
  environment,
  readEnvironment,
  reset,
  subscribe,
  updateConfig,
  watchAll,
  type Override,
} from '@lib/runtime-config';
import { clearLogs } from '@lib/holz-idb-backend';
import { createLogger } from '@lib/observability';
import { filter } from '@lib/observability/config';
import { type AdvancedSettingsState } from './settings';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Resolve every Advanced setting for the active environment in one pass,
 * layering any persisted OPFS override over each option's default.
 */
export const readAdvancedSettings =
  async (): Promise<AdvancedSettingsState> => {
    const logFilter = await readEnvironment(filter);

    return { logFilter: logFilter.pattern };
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

/**
 * Delete every log persisted on this origin. Logs still buffered in a
 * backend land afterward, so the archive is rarely empty for long.
 */
export const deleteLogs = async (): Promise<void> => {
  await clearLogs();
  logger.info('Logs deleted.');
};

/** One Advanced option settling on a new resolved value. */
export type AdvancedSettingChange = { option: 'logFilter'; pattern: string };

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
  ]);
