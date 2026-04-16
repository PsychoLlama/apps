import { defineStore, type Ref } from '#state';
import { registerSession } from './ambient';
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
  streams: Record<string, Ref<MediaStream>>;
  recorder: Ref<MediaRecorder> | null;
  chunks: Ref<Blob[]> | null;
}

export const createSessionStore = defineStore<SessionState>(
  () => ({
    status: 'idle',
    tracks: [],
    error: null,
    streams: {},
    recorder: null,
    chunks: null,
  }),
  (on) => {
    on(startRecordingWorkflow.started, (state) => {
      state.status = 'recording';
      state.error = null;
    });

    on(
      startRecordingWorkflow.resolved,
      (state, { tracks, streams, recorder, chunks }) => {
        state.tracks = tracks;
        state.streams = streams;
        state.recorder = recorder;
        state.chunks = chunks;
      },
    );

    on(startRecordingWorkflow.rejected, (state, error) => {
      state.status = 'error';
      state.error = error.message;
    });

    on(stopRecordingWorkflow.started, (state) => {
      state.status = 'idle';
      state.tracks = [];
      state.error = null;
    });

    // Refs clear on resolved so stop/release activities still see them.
    on(stopRecordingWorkflow.resolved, (state) => {
      state.streams = {};
      state.recorder = null;
      state.chunks = null;
    });

    on(pauseRecordingWorkflow.started, (state) => {
      state.status = 'paused';
    });

    on(resumeRecordingWorkflow.started, (state) => {
      state.status = 'recording';
    });

    on(addTrackWorkflow.resolved, (state, { track, streamRef }) => {
      state.tracks.push(track);
      state.streams[track.id] = streamRef;
    });

    on(removeTrackWorkflow.resolved, (state, trackId) => {
      const index = state.tracks.findIndex((t) => t.id === trackId);
      if (index !== -1) state.tracks.splice(index, 1);
      delete state.streams[trackId];
    });

    on(checkSupportWorkflow.resolved, (state, supported) => {
      if (!supported) state.status = 'unsupported';
    });
  },
);

export const [session] = createSessionStore();
registerSession(session);
