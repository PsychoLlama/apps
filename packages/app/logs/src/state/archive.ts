import { defineCommand, defineStore } from '@lib/state';
import type { Log } from '@lib/observability';

/** A persisted log, tagged with the key IndexedDB stores it under. */
export interface ArchivedLog extends Log {
  /** The log's IndexedDB key. Unique, so it names the entry across reads. */
  id: number;
}

/** The on-device log archive, as read back from IndexedDB. */
export interface ArchiveState {
  /** Persisted logs, newest-first. Empty until a read resolves. */
  entries: ArchivedLog[];
}

/**
 * The archive the viewer renders, live while any view holds it. Nothing
 * durable dies with it: IndexedDB holds the logs, and the store is a mirror
 * re-read on mount.
 */
export const $archive = defineStore<ArchiveState>(() => ({
  entries: [],
}));

/** The archive read landed. */
export const $archiveLoaded = defineCommand(
  [$archive],
  (archive) => (entries: ArchivedLog[]) => {
    archive.entries = entries;
  },
);
