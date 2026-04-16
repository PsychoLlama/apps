import { defineStore } from '#state';
import { stopRecordingWorkflow } from '../session/workflows';
import type { Recording } from './types';

export interface LibraryState {
  recordings: Recording[];
}

export const createLibraryStore = defineStore<LibraryState>(
  () => ({ recordings: [] }),
  (on) => {
    on(stopRecordingWorkflow.resolved, (state, { id, elapsed, stoppedAt }) => {
      state.recordings.push({
        id,
        name: `Recording ${state.recordings.length + 1}`,
        duration: elapsed,
        createdAt: stoppedAt,
      });
    });
  },
);
