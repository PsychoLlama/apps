import { defineCell, defineFold, defineStore, defineTopic } from '@lib/state';
import type { Log } from '@lib/observability';
import type {
  LogConnection,
  PruneRecord,
} from '@lib/holz-idb-backend/database';
import { logsScope } from '../scope';
import { closeConnection } from './capabilities';

/**
 * Where the archive read sits.
 *
 * - `loading` — the read hasn't resolved. The site is SSG'd and IndexedDB is
 *   client-only, so this is also what prerender and first paint show; the UI
 *   renders it as a skeleton rather than a misleading empty state.
 * - `ready` — the read resolved; `entries` holds the archive (possibly empty).
 * - `error` — the read failed; `entries` stays empty.
 */
export type ArchiveStatus = 'loading' | 'ready' | 'error';

/**
 * How the in-memory archive relates to what's persisted on disk.
 *
 * - `initial` — no read has resolved yet, so there's no baseline to compare
 *   against. Also the SSG/first-paint state. The refresh action stays hidden.
 * - `current` — `entries` matches the store as of the last read. The refresh
 *   action shows but is disabled — there's nothing new to pull in.
 * - `stale` — the backend pinged that new logs landed since the last read, so
 *   `entries` is behind disk. The refresh action lights up.
 */
export type ArchiveFreshness = 'initial' | 'current' | 'stale';

/** The on-device log archive, as read back from IndexedDB. */
export interface ArchiveState {
  /** Where the archive read sits in its lifecycle. */
  status: ArchiveStatus;
  /** How `entries` relates to what's persisted — drives the refresh action. */
  freshness: ArchiveFreshness;
  /** Persisted logs, newest-first. Empty until a read resolves. */
  entries: Log[];
  /**
   * The last pruning pass, or `null` when nothing has ever been pruned. Dates
   * the gap below the oldest entry, which the entries alone can't show.
   */
  pruned: PruneRecord | null;
}

/** Source of truth for the archive the viewer renders. */
export const archiveStore = defineStore<ArchiveState>(logsScope, () => ({
  status: 'loading',
  freshness: 'initial',
  entries: [],
  pruned: null,
}));

/**
 * The viewer's own connection to the IndexedDB archive, held open for the
 * lifetime of the view so a refresh walks the live store directly instead of
 * reopening. A cell, not store state — a reactive store would hand the reads a
 * proxy of the host connection. `null` until it opens, which is also its state
 * during SSG and first paint, since IndexedDB is client-only.
 *
 * Dropping it closes the connection, so a view that's navigated away from
 * releases it without the component arranging anything.
 */
export const connectionCell = defineCell<LogConnection | null>(
  logsScope,
  () => null,
  { drop: closeConnection },
);

/** A freshly read snapshot together with the connection it was read through. */
export interface LoadedArchive {
  /** The opened connection, handed to the cell to hold and later close. */
  db: LogConnection;
  /** The archive contents, newest-first. */
  entries: Log[];
  /** The last pruning pass, or `null` if the archive has never been pruned. */
  pruned: PruneRecord | null;
}

/**
 * The archive read landed, through the connection it opened. The snapshot is
 * current as of that read, so freshness resets to `current` — any ping that
 * arrived while the read was in flight is absorbed by it.
 */
export const archiveLoadedTopic = defineTopic<LoadedArchive>();
defineFold(
  archiveLoadedTopic,
  [archiveStore, connectionCell],
  (archive, held, loaded) => {
    archive.status = 'ready';
    archive.freshness = 'current';
    archive.entries = loaded.entries;
    archive.pruned = loaded.pruned;
    held.current = loaded.db;
  },
);

/**
 * The archive read failed. The viewer is read-only, so there's nothing to
 * retry into — it drops to the error state rather than spinning on the
 * skeleton forever.
 */
export const archiveLoadFailedTopic = defineTopic();
defineFold(archiveLoadFailedTopic, [archiveStore], (archive) => {
  archive.status = 'error';
});

/**
 * The backend persisted new logs, so what's shown is behind disk. Only
 * meaningful once a read has landed a `current` baseline — before that the
 * in-flight read will show whatever's there, and once a ping is already
 * pending nothing changes.
 */
export const logsInsertedTopic = defineTopic();
defineFold(logsInsertedTopic, [archiveStore], (archive) => {
  if (archive.freshness === 'current') archive.freshness = 'stale';
});

/**
 * A refresh read landed. It reads only what arrived since the last snapshot,
 * so prepend it: both the new tail and the held entries are newest-first, and
 * everything new outranks everything held, so concatenation preserves the
 * global order. A press that turned up nothing still settles freshness back to
 * `current`.
 */
export const archiveRefreshedTopic = defineTopic<Log[]>();
defineFold(archiveRefreshedTopic, [archiveStore], (archive, added) => {
  archive.freshness = 'current';
  if (added.length > 0) archive.entries = [...added, ...archive.entries];
});
