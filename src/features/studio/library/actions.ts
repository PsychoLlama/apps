import { defineAction } from '#state/next';
import { libraryStore } from './store';

export interface AddRecordingInput {
  id: string;
  elapsed: number;
  stoppedAt: number;
  url: string;
}

/** Append a new recording to the library. Name auto-numbers from the list length. */
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

/** Remove a recording by id. No-op when the id is unknown. */
export const deleteRecording = defineAction(
  [libraryStore],
  (library, id: string) => {
    const index = library.recordings.findIndex((r) => r.id === id);
    if (index !== -1) library.recordings.splice(index, 1);
  },
);

/** Rename a recording by id. No-op when the id is unknown. */
export const renameRecording = defineAction(
  [libraryStore],
  (library, input: { id: string; name: string }) => {
    const recording = library.recordings.find((r) => r.id === input.id);
    if (recording) recording.name = input.name;
  },
);
