import {
  environment,
  reset,
  updateConfig,
  type Override,
} from '@lib/runtime-config';
import { clearLogs } from '@lib/holz-idb-backend';
import { createLogger } from '@lib/observability';
import { filter } from '@lib/observability/config';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

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
