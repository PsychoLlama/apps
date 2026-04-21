import { defineAction, defineEffect } from '#state';
import { revokeRecording } from './capabilities';
import { libraryStore } from './store';

export interface AddRecordingInput {
  readonly id: string;
  readonly elapsed: number;
  readonly stoppedAt: number;
  readonly url: string;
}

// --- Actions ---
// Named and exported so tests can drive state transitions directly.

export const addRecording = defineAction(
  [libraryStore],
  (library, input: AddRecordingInput) => {
    library.recordings.push({
      id: input.id,
      name: `Recording ${library.recordings.length + 1}`,
      duration: input.elapsed,
      createdAt: input.stoppedAt,
      url: input.url,
    });
  },
);

export const deleteRecording = defineAction(
  [libraryStore],
  (library, id: string) => {
    const index = library.recordings.findIndex(
      (recording) => recording.id === id,
    );
    if (index !== -1) library.recordings.splice(index, 1);
  },
);

// --- Effects ---

/**
 * Revoke a recording's blob URL and remove it from the library on
 * success. Revoke runs first; a failure there leaves the recording in
 * place so the user can retry.
 */
export const deleteRecordingEffect = defineEffect(
  (input: { id: string; url: string }): string => {
    revokeRecording(input.url);
    return input.id;
  },
  { onSuccess: deleteRecording },
);
