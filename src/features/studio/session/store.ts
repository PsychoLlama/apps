import { defineStore, createStore } from '#state';
import type { SessionStatus, Track } from './types';

export interface SessionState {
  status: SessionStatus;
  tracks: Track[];
  error: string | null;
  streams: Record<string, MediaStream>;
  recorder: MediaRecorder | null;
  chunks: Blob[] | null;
}

export const sessionStore = defineStore<SessionState>(() => ({
  status: 'idle',
  tracks: [],
  error: null,
  streams: {},
  recorder: null,
  chunks: null,
}));

// Self-bootstrap so module imports give callers a live readonly view.
export const session = createStore(sessionStore);
