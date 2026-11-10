import { collect } from '@lib/effects';
import { createLogger, deleteLogsDatabase } from '@lib/observability';
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
    await deleteLogsDatabase();
    logger.info('Logs deleted.');
    logsDeleted();
  },
);
