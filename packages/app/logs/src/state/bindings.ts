import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger, toError } from '@lib/observability';
import { closeArchive, loadArchive, type LoadedArchive } from './capabilities';
import { logsStore } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Land a freshly read snapshot, plus the connection it came through, and mark the archive ready. */
export const setLogs = defineAction(
  [logsStore],
  (state, archive: LoadedArchive) => {
    state.status = 'ready';
    state.entries = archive.entries;
    state.db = ref(archive.db);
  },
);

/**
 * Record a failed read. The viewer is read-only, so there's nothing to
 * retry into — drop to the `error` state and log it rather than spin on the
 * skeleton forever.
 */
export const failLogs = defineAction([logsStore], (state, error: Error) => {
  state.status = 'error';
  logger.error('Failed to read the log archive.', { error: toError(error) });
});

/** Forget the connection once it's been closed. */
const clearDatabase = defineAction([logsStore], (state) => {
  state.db = null;
});

/**
 * Load the persisted archive from IndexedDB into the store. Client-only —
 * IndexedDB is unavailable during SSG — so perform it from `onMount`. The
 * connection it opens is held in state, so {@link releaseLogsEffect} must run
 * on cleanup to close it.
 */
export const loadLogsEffect = defineEffect([], loadArchive, {
  onSuccess: setLogs,
  onFailure: failLogs,
});

/**
 * Close the held connection and forget it. Pairs with the mount-time open so a
 * viewer that's navigated away from doesn't leak its connection. The close is
 * the side effect; the action only drops the reference.
 */
export const releaseLogsEffect = defineEffect([logsStore], closeArchive, {
  onSuccess: clearDatabase,
});
