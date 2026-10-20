import { clearLogs } from '@lib/holz-idb-backend';
import { createLogger } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Delete every log persisted on this origin. Logs still buffered in a
 * backend land afterward, so the archive is rarely empty for long.
 */
export const deleteLogs = async (): Promise<void> => {
  await clearLogs();
  logger.info('Logs deleted.');
};
