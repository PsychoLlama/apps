import { collect } from '@lib/effects';
import { clearLogs } from '@lib/holz-idb-backend';
import { createLogger } from '@lib/observability';
import { $logsDeleted } from '../state/log-storage';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Delete every log persisted on this origin, then show the notice. Logs
 * still buffered in a backend land afterward, so the archive is rarely
 * empty for long.
 */
export const $deleteLogs = collect(
  [$logsDeleted],
  (logsDeleted) => async (): Promise<void> => {
    await clearLogs();
    logger.info('Logs deleted.');
    logsDeleted();
  },
);
