import { defineAction, defineEffect, ref } from '@lib/state';
import { createLogger, toError, type Log } from '@lib/observability';
import {
  closeArchive,
  loadArchive,
  reloadArchive,
  type LoadedArchive,
} from './capabilities';
import { logsStore } from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Land a freshly read snapshot, plus the connection it came through, and mark
 * the archive ready. The snapshot is current as of this read, so freshness
 * resets to `current` — any ping that arrived while the read was in flight is
 * absorbed by it.
 */
export const setLogs = defineAction(
  [logsStore],
  (state, archive: LoadedArchive) => {
    state.status = 'ready';
    state.freshness = 'current';
    state.entries = archive.entries;
    state.db = ref(archive.db);
  },
);

/**
 * Mark the shown archive behind disk after the backend reports new logs. Only
 * meaningful once a read has landed a `current` baseline — before that the
 * in-flight read will show whatever's there, and after a ping is already
 * pending nothing changes.
 */
export const markLogsStale = defineAction([logsStore], (state) => {
  if (state.freshness === 'current') state.freshness = 'stale';
});

/** Land a re-read snapshot into the open connection and mark the archive current again. */
const applyReload = defineAction([logsStore], (state, entries: Log[]) => {
  state.freshness = 'current';
  state.entries = entries;
});

/**
 * Record a failed refresh. Unlike the initial read, the viewer already has a
 * snapshot on screen and a live connection — so leave both in place and stay
 * `stale` (the action remains available to retry), just log the failure.
 */
const failRefresh = defineAction([logsStore], (_state, error: Error) => {
  logger.error('Failed to refresh the log archive.', { error: toError(error) });
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

/**
 * Re-read the archive through the held connection and land the fresh snapshot.
 * Backs the refresh action, which only surfaces once {@link loadLogsEffect} has
 * opened a connection — so this reuses it rather than opening a second.
 */
export const refreshLogsEffect = defineEffect([logsStore], reloadArchive, {
  onSuccess: applyReload,
  onFailure: failRefresh,
});
