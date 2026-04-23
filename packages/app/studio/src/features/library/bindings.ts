import { defineAction, defineEffect } from '@lib/state';
import {
  loadRecordings,
  removePersistedRecording,
  revokeRecording,
} from './capabilities';
import { libraryStore } from './store';
import type { Recording } from './types';

/**
 * Drop a recording from the library by id and tombstone it if the
 * library hasn't hydrated yet. The tombstone keeps a stale hydrate
 * snapshot from resurrecting a recording that was deleted while the
 * IDB read was still in flight.
 */
export const deleteRecording = defineAction(
  [libraryStore],
  (library, id: string) => {
    const index = library.recordings.findIndex(
      (recording) => recording.id === id,
    );
    if (index !== -1) library.recordings.splice(index, 1);
    if (!library.loaded) library.tombstones.push(id);
  },
);

/**
 * Drop a recording from IndexedDB, revoke its blob URL, and remove it
 * from state. State is always cleared on the user's intent — even when
 * the IDB delete rejects (which is the only way to remove an in-memory
 * fallback recording when storage is unavailable). A persistent-store
 * failure logs a warning; the entry will reappear on the next reload
 * if it was actually on disk, and the user can re-delete then.
 */
export const deleteRecordingEffect = defineEffect(
  [],
  async (input: { id: string; url: string }): Promise<string> => {
    try {
      await removePersistedRecording(input.id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to remove recording from IndexedDB', error);
    }
    revokeRecording(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording },
);

/**
 * Append the persisted set into the live library, mark it loaded, and
 * release the tombstone list. Append (not replace) so a recording
 * captured while the IDB read was in flight isn't clobbered by the
 * older snapshot — duplicate and tombstone filtering happen upstream
 * in `loadRecordingsEffect`. The `loaded` early-return revokes the
 * dropped URLs first to plug a microtask race: when two hydrates
 * resolve before either dispatches, the second's filter sees a stale
 * empty state, so its array reaches us with URLs that would otherwise
 * leak.
 */
export const hydrateLibrary = defineAction(
  [libraryStore],
  (library, recordings: Recording[] | null) => {
    if (recordings === null) return;
    if (library.loaded) {
      for (const entry of recordings) revokeRecording(entry.url);
      return;
    }
    library.recordings.push(...recordings);
    library.recordings.sort((left, right) => left.createdAt - right.createdAt);
    library.tombstones = [];
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
    library.tombstones = [];
    library.loaded = true;
  },
);

/**
 * Read every persisted recording and merge it into the library on
 * first call. Recordings already in state win against their persisted
 * twin (the freshly-minted blob URL is revoked) so a capture that
 * landed while the IDB read was in flight isn't dropped; tombstoned
 * ids are skipped likewise so a deletion during hydrate isn't
 * resurrected. Subsequent calls short-circuit on `loaded`.
 */
export const loadRecordingsEffect = defineEffect(
  [libraryStore],
  async (library): Promise<Recording[] | null> => {
    if (library.loaded) return null;
    const persisted = await loadRecordings();
    const seen = new Set(library.recordings.map((entry) => entry.id));
    const tombstoned = new Set(library.tombstones);
    return persisted.filter((entry) => {
      if (seen.has(entry.id) || tombstoned.has(entry.id)) {
        revokeRecording(entry.url);
        return false;
      }
      return true;
    });
  },
  { onSuccess: hydrateLibrary, onFailure: markLibraryLoadFailed },
);
