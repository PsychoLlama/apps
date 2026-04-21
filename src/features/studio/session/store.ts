import { defineStore, createStore } from '#state';
import type { SessionStatus, Track } from './types';

/** Live state of the in-progress recording session. */
export interface SessionState {
  /** Current lifecycle phase. */
  status: SessionStatus;
  /** User-visible tracks composing the recording, in capture order. */
  tracks: Track[];
  /** Message from the most recent failed start, cleared on retry. */
  error: string | null;
  /** Live media streams keyed by track id, used at stop-time to release devices. */
  streams: Record<string, MediaStream>;
  /** Active recorder draining the combined stream. `null` outside of capture. */
  recorder: MediaRecorder | null;
  /** Data chunks the recorder has emitted so far, drained on stop. */
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
