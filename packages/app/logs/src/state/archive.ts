import { defineCommand, defineStore } from '@lib/state';
import type { Log } from '@lib/observability';
import type { PruneRecord } from '@lib/holz-idb-backend/database';

/** A persisted log, tagged with the key IndexedDB stores it under. */
export interface ArchivedLog extends Log {
  /** The log's IndexedDB key. Unique, so it names the entry across reads. */
  id: number;
}

/** The on-device log archive, as read back from IndexedDB. */
export interface ArchiveState {
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
  entries: [],
  pruned: null,
}));

/** The archive read landed. */
export const $archiveLoaded = defineCommand(
  [$archive],
  (archive) => (entries: ArchivedLog[], pruned: PruneRecord | null) => {
    archive.entries = entries;
    archive.pruned = pruned;
  },
);
