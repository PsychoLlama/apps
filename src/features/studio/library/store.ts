import { defineStore } from '#state';
import { stopRecordingWorkflow } from '../session/workflows';
import { deleteRecordingWorkflow, renameRecordingWorkflow } from './workflows';
import type { Recording } from './types';

export interface LibraryState {
  recordings: Recording[];
}

export const createLibraryStore = defineStore<LibraryState>(
  () => ({ recordings: [] }),
  (on) => {
    on(
      stopRecordingWorkflow.resolved,
      (state, { id, elapsed, stoppedAt, url }) => {
        state.recordings.push({
          id,
          name: `Recording ${state.recordings.length + 1}`,
          duration: elapsed,
          createdAt: stoppedAt,
          url,
        });
      },
    );

    on(deleteRecordingWorkflow.resolved, (state, id) => {
      const index = state.recordings.findIndex((r) => r.id === id);
      if (index !== -1) state.recordings.splice(index, 1);
    });

    on(renameRecordingWorkflow.resolved, (state, { id, name }) => {
      const recording = state.recordings.find((r) => r.id === id);
      if (recording) recording.name = name;
    });
  },
);

export const [library] = createLibraryStore();
