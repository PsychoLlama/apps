import { defineAction, defineEffect } from '@lib/state';
import {
  loadRecordings,
  removePersistedRecording,
  revokeRecording,
} from './capabilities';
import { libraryStore } from './store';
import type { Recording } from './types';

/** Drop a recording from the library by id. No-op on unknown ids. */
export const deleteRecording = defineAction(
  [libraryStore],
  (library, id: string) => {
    const index = library.recordings.findIndex(
      (recording) => recording.id === id,
    );
    if (index !== -1) library.recordings.splice(index, 1);
  },
);

/**
 * Drop a recording from IndexedDB, revoke its blob URL, then remove it
 * from state. Persistent storage is the source of truth, so an IDB
 * failure leaves the entry visible for the user to retry.
 */
export const deleteRecordingEffect = defineEffect(
  [],
  async (input: { id: string; url: string }): Promise<string> => {
    await removePersistedRecording(input.id);
    revokeRecording(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording },
);

/**
 * Merge the persisted set into the live library and mark it loaded.
 * Merge (not replace) so a recording captured while the IDB read was
 * in flight isn't clobbered by the older snapshot. Idempotent on
 * `loaded` so re-mounts don't orphan blob URLs the first hydration
 * handed out.
 */
export const hydrateLibrary = defineAction(
  [libraryStore],
  (library, recordings: Recording[] | null) => {
    if (recordings === null || library.loaded) return;
    const seen = new Set(library.recordings.map((entry) => entry.id));
    for (const recording of recordings) {
      if (!seen.has(recording.id)) library.recordings.push(recording);
    }
    library.recordings.sort((left, right) => left.createdAt - right.createdAt);
    library.loaded = true;
  },
);

/**
 * Read every persisted recording and seed the library on first call.
 * Subsequent calls short-circuit so we don't re-mint blob URLs over the
 * already-hydrated set.
 */
export const loadRecordingsEffect = defineEffect(
  [libraryStore],
  async (library): Promise<Recording[] | null> => {
    if (library.loaded) return null;
    return loadRecordings();
  },
  { onSuccess: hydrateLibrary },
);
