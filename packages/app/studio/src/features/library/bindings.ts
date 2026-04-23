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
 * Log a failed delete. State is left untouched on purpose: persistent
 * storage is still the source of truth, so the entry stays visible
 * for the user to retry.
 */
export const markRecordingDeleteFailed = defineAction(
  [libraryStore],
  (_library, error: Error) => {
    // eslint-disable-next-line no-console
    console.warn('Failed to delete recording from IndexedDB', error);
  },
);

/**
 * Drop a recording from IndexedDB, revoke its blob URL, then remove it
 * from state. Persistent storage is the source of truth, so an IDB
 * failure leaves the entry visible for the user to retry — callers can
 * detect that by checking whether the recording still exists in
 * library state after awaiting.
 */
export const deleteRecordingEffect = defineEffect(
  [],
  async (input: { id: string; url: string }): Promise<string> => {
    await removePersistedRecording(input.id);
    revokeRecording(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording, onFailure: markRecordingDeleteFailed },
);

/**
 * Append the persisted set into the live library and mark it loaded.
 * Append (not replace) so a recording captured while the IDB read was
 * in flight isn't clobbered by the older snapshot — duplicate filtering
 * happens upstream in `loadRecordingsEffect` so this stays a pure
 * mutation. Idempotent on `loaded` so re-mounts don't double-append.
 */
export const hydrateLibrary = defineAction(
  [libraryStore],
  (library, recordings: Recording[] | null) => {
    if (recordings === null || library.loaded) return;
    library.recordings.push(...recordings);
    library.recordings.sort((left, right) => left.createdAt - right.createdAt);
    library.loaded = true;
  },
);

/**
 * Log a failed hydrate and mark the library loaded so the app falls
 * back to an in-memory-only library instead of retrying every mount.
 * Without this, an IDB-unavailable environment surfaces as an
 * unhandled rejection during route mount.
 */
export const markLibraryLoadFailed = defineAction(
  [libraryStore],
  (library, error: Error) => {
    // eslint-disable-next-line no-console
    console.warn('Failed to hydrate library from IndexedDB', error);
    library.loaded = true;
  },
);

/**
 * Read every persisted recording and merge it into the library on
 * first call. Recordings already in state win against their persisted
 * twin (the freshly-minted blob URL is revoked) so a capture that
 * landed while the IDB read was in flight isn't dropped. Subsequent
 * calls short-circuit on `loaded`.
 */
export const loadRecordingsEffect = defineEffect(
  [libraryStore],
  async (library): Promise<Recording[] | null> => {
    if (library.loaded) return null;
    const persisted = await loadRecordings();
    const seen = new Set(library.recordings.map((entry) => entry.id));
    return persisted.filter((entry) => {
      if (seen.has(entry.id)) {
        revokeRecording(entry.url);
        return false;
      }
      return true;
    });
  },
  { onSuccess: hydrateLibrary, onFailure: markLibraryLoadFailed },
);
