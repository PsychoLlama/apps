import { defineAction, defineEffect } from '@lib/state';
import { createLogger, toError, type Log } from '@lib/observability';
import { readLogsByTimestamp } from '@lib/holz-idb-backend/database';
import { logsStore } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Land a freshly read snapshot and mark the archive ready. */
export const setLogs = defineAction([logsStore], (state, entries: Log[]) => {
  state.status = 'ready';
  state.entries = entries;
});

/**
 * Record a failed read. The viewer is read-only, so there's nothing to
 * retry into — drop to the `error` state and log it rather than spin on the
 * skeleton forever.
 */
export const failLogs = defineAction([logsStore], (state, error: Error) => {
  state.status = 'error';
  logger.error('Failed to read the log archive.', { error: toError(error) });
});

/**
 * Load the persisted archive from IndexedDB into the store. Client-only —
 * IndexedDB is unavailable during SSG — so perform it from `onMount`.
 */
export const loadLogsEffect = defineEffect([], readLogsByTimestamp, {
  onSuccess: setLogs,
  onFailure: failLogs,
});
