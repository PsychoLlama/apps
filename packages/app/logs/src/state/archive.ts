import { defineCommand, defineStore } from '@lib/state';
import type { Log } from '@lib/observability';
import type { PruneRecord } from '@lib/holz-idb-backend/database';

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

/** A persisted log, tagged with the key IndexedDB stores it under. */
export interface ArchivedLog extends Log {
  /** The log's IndexedDB key. Unique, so it names the entry across reads. */
  id: number;
}

/** The on-device log archive, as read back from IndexedDB. */
export interface ArchiveState {
  /** How `entries` relates to what's persisted — drives the refresh action. */
  freshness: ArchiveFreshness;

  /** Persisted logs, newest-first. Empty until a read resolves. */
  entries: ArchivedLog[];

  /**
   * The last pruning pass, or `null` when nothing has ever been pruned. Dates
   * the gap below the oldest entry, which the entries alone can't show.
   */
  pruned: PruneRecord | null;
}

/**
 * The archive the viewer renders, live while any view holds it. Nothing
 * durable dies with it: IndexedDB holds the logs, and the store is a mirror
 * re-read on mount.
 */
export const $archive = defineStore<ArchiveState>(() => ({
  freshness: 'initial',
  entries: [],
  pruned: null,
}));

/**
 * The archive read landed. The snapshot is current as of that read, so
 * freshness resets to `current`.
 */
export const $archiveLoaded = defineCommand(
  [$archive],
  (archive) => (entries: ArchivedLog[], pruned: PruneRecord | null) => {
    archive.freshness = 'current';
    archive.entries = entries;
    archive.pruned = pruned;
  },
);

/**
 * The backend persisted new logs, so what's shown is behind disk. Only
 * meaningful once a read has landed a `current` baseline.
 */
export const $logsInserted = defineCommand([$archive], (archive) => () => {
  if (archive.freshness === 'current') archive.freshness = 'stale';
});

/**
 * A refresh read landed. It reads only what arrived since the last snapshot,
 * so prepend it: both are newest-first, and everything new outranks
 * everything held. A press that turned up nothing still settles freshness
 * back to `current`.
 */
export const $archiveRefreshed = defineCommand(
  [$archive],
  (archive) => (added: ArchivedLog[]) => {
    archive.freshness = 'current';
    if (added.length > 0) archive.entries = [...added, ...archive.entries];
  },
);
