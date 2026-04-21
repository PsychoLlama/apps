import { type Ref } from '#state';
import { defineAction } from '#state/next';
import { libraryStore } from '../library/store';
import { timerStore } from '../timer/store';
import { sessionStore } from './store';
import type { Track } from './types';

export interface RecordingContext {
  readonly tracks: Track[];
  readonly streams: Record<string, Ref<MediaStream>>;
  readonly recorder: Ref<MediaRecorder>;
  readonly chunks: Ref<Blob[]>;
}

export interface FinalizedRecording {
  readonly id: string;
  readonly elapsed: number;
  readonly stoppedAt: number;
  readonly url: string;
}

/**
 * Transition into the recording state and start the elapsed timer. Runs as
 * `onStart` of the start-recording effect — the session is optimistically
 * marked recording before screen capture resolves.
 */
export const beginRecording = defineAction(
  [sessionStore, timerStore],
  (session, timer, input: unknown) => {
    void input;
    session.status = 'recording';
    session.error = null;
    timer.running = true;
    timer.elapsed = 0;
  },
);

/** Populate the session with the recording context captured by the effect. */
export const setRecordingContext = defineAction(
  [sessionStore],
  (session, context: RecordingContext) => {
    session.tracks = context.tracks;
    session.streams = context.streams;
    session.recorder = context.recorder;
    session.chunks = context.chunks;
  },
);

/** Mark the session as failed. */
export const markError = defineAction(
  [sessionStore],
  (session, error: Error) => {
    session.status = 'error';
    session.error = error.message;
  },
);

/**
 * Transition out of recording. Clears tracks, stops the timer. Refs linger
 * so the stop effect callback can still reach the recorder to finalize.
 */
export const beginStop = defineAction(
  [sessionStore, timerStore],
  (session, timer, input: unknown) => {
    void input;
    session.status = 'idle';
    session.tracks = [];
    session.error = null;
    timer.running = false;
  },
);

/**
 * Clear session refs and append the recording to the library in a single
 * atomic update. Runs as `onSuccess` of the stop effect.
 */
export const finalizeRecording = defineAction(
  [sessionStore, libraryStore],
  (session, library, result: FinalizedRecording) => {
    session.streams = {};
    session.recorder = null;
    session.chunks = null;

    library.recordings.push({
      id: result.id,
      name: `Recording ${library.recordings.length + 1}`,
      duration: result.elapsed,
      createdAt: result.stoppedAt,
      url: result.url,
    });
  },
);

/** Pause the session and freeze the timer. */
export const beginPause = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'paused';
    timer.running = false;
  },
);

/** Resume the session and restart the timer without resetting elapsed. */
export const beginResume = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'recording';
    timer.running = true;
  },
);

/** Add a mid-recording track. */
export const appendTrack = defineAction(
  [sessionStore],
  (session, input: { track: Track; streamRef: Ref<MediaStream> }) => {
    session.tracks.push(input.track);
    session.streams[input.track.id] = input.streamRef;
  },
);

/** Drop a track by id. */
export const removeTrackFromState = defineAction(
  [sessionStore],
  (session, trackId: string) => {
    const index = session.tracks.findIndex((t) => t.id === trackId);
    if (index !== -1) session.tracks.splice(index, 1);
    delete session.streams[trackId];
  },
);

/** Apply the support-check result. No-op when supported. */
export const markUnsupportedIf = defineAction(
  [sessionStore],
  (session, supported: boolean) => {
    if (!supported) session.status = 'unsupported';
  },
);
