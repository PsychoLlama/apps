import { defineAction, defineEffect } from '#state';
import { revokeRecording } from './capabilities';
import { libraryStore } from './store';

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
 * Revoke a recording's blob URL and remove it from the library on
 * success. Revoke runs first; a failure there leaves the recording in
 * place so the user can retry.
 */
export const deleteRecordingEffect = defineEffect(
  [],
  (input: { id: string; url: string }): string => {
    revokeRecording(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording },
);
