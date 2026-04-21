import { createStore, defineStore, type Ref } from '#state';
import type { SessionStatus, Track } from './types';

export interface SessionState {
  status: SessionStatus;
  tracks: Track[];
  error: string | null;
  streams: Record<string, Ref<MediaStream>>;
  recorder: Ref<MediaRecorder> | null;
  chunks: Ref<Blob[]> | null;
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
