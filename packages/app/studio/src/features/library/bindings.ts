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
 * Replace the live library with the hydrated set from disk. Idempotent:
 * skips when state is already loaded so re-mounts don't orphan the blob
 * URLs the first hydration handed out.
 */
export const hydrateLibrary = defineAction(
  [libraryStore],
  (library, recordings: Recording[] | null) => {
    if (recordings === null || library.loaded) return;
    library.recordings = recordings;
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
