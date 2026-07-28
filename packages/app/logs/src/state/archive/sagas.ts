import { AbortError, call, commit, defineSaga, read } from '@lib/state-next';
import {
  archiveLoadFailedTopic,
  archiveLoadedTopic,
  archiveRefreshedTopic,
  archiveStore,
  connectionCell,
  logsInsertedTopic,
} from './archive';
import {
  loadArchive,
  nextLogInsert,
  readNewLogs,
  watchLogInserts,
} from './capabilities';
import { logsScope } from '../scope';

/**
 * Bring the archive on screen and keep it honest. Opens the backend's insert
 * channel, reads the archive through its own connection, then flags the view
 * stale on every later ping for as long as the scope lives.
 *
 * `LogList` runs it once on mount — IndexedDB and `BroadcastChannel` are both
 * client-only, so neither can run during SSG.
 *
 * Order matters. Subscribing before the read means a ping landing mid-read is
 * buffered rather than lost; pulling after the snapshot lands means it's
 * replayed on top of a `current` baseline, where it flags the view stale,
 * instead of hitting the `initial` state that ignores it.
 *
 * Guarded on an empty connection cell so a second anchor can't open a second
 * connection, which the cell would silently drop unclosed. It never ends on
 * its own: releasing the last anchor aborts it, which drops the subscription
 * and closes the connection.
 */
export const trackArchiveSaga = defineSaga(logsScope, async function* () {
  if (yield* read(connectionCell)) return;

  const inserts = yield* call(watchLogInserts);

  try {
    const archive = yield* call(loadArchive);
    yield commit(archiveLoadedTopic(archive));
  } catch (error) {
    // Teardown mid-read isn't a failed read — the scope is going away, and
    // there's nobody left to show an error state to.
    if (error instanceof AbortError) throw error;

    // Reported by the capability, which has the context to describe it.
    yield commit(archiveLoadFailedTopic());
  }

  while (yield* call(nextLogInsert, inserts)) {
    yield commit(logsInsertedTopic());
  }
});

/**
 * Pull the logs added since the snapshot and land them ahead of it. Backs the
 * header's refresh action, which only surfaces once {@link trackArchiveSaga}
 * has opened a connection — so this reuses it rather than opening a second.
 *
 * A failure changes nothing: the viewer keeps the snapshot it has and stays
 * stale, so the action remains available to try again.
 */
export const refreshArchiveSaga = defineSaga(logsScope, async function* () {
  const db = yield* read(connectionCell);
  const { entries } = yield* read(archiveStore);

  try {
    // `entries` is newest-first, so the head carries the highest timestamp seen.
    const added = yield* call(readNewLogs, db, entries[0]?.timestamp);
    yield commit(archiveRefreshedTopic(added));
  } catch {
    // Logged by the capability. Nothing changed, so nothing to commit.
  }
});
