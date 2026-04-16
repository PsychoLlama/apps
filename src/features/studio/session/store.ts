import { defineStore } from '#state';
import type { SessionStatus, Track } from './types';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
  addTrackWorkflow,
  removeTrackWorkflow,
  checkSupportWorkflow,
} from './workflows';

export interface SessionState {
  status: SessionStatus;
  tracks: Track[];
  error: string | null;
}

export const createSessionStore = defineStore<SessionState>(
  () => ({ status: 'idle', tracks: [], error: null }),
  (on) => {
    on(startRecordingWorkflow.started, (state) => {
      state.status = 'recording';
      state.error = null;
    });

    on(startRecordingWorkflow.resolved, (state, { tracks }) => {
      state.tracks = tracks;
    });

    on(startRecordingWorkflow.rejected, (state, error) => {
      state.status = 'error';
      state.error = error.message;
    });

    on(stopRecordingWorkflow.started, (state) => {
      state.status = 'idle';
      state.tracks = [];
      state.error = null;
    });

    on(pauseRecordingWorkflow.started, (state) => {
      state.status = 'paused';
    });

    on(resumeRecordingWorkflow.started, (state) => {
      state.status = 'recording';
    });

    on(addTrackWorkflow.resolved, (state, track) => {
      state.tracks.push(track);
    });

    on(removeTrackWorkflow.resolved, (state, trackId) => {
      const index = state.tracks.findIndex((t) => t.id === trackId);
      if (index !== -1) state.tracks.splice(index, 1);
    });

    on(checkSupportWorkflow.resolved, (state, supported) => {
      if (!supported) state.status = 'unsupported';
    });
  },
);
