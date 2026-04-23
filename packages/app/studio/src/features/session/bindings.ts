import { defineAction, defineEffect } from '@lib/state';
import { libraryStore } from '../library/store';
import { timerStore } from '../timer/store';
import {
  captureTrack,
  checkSupport,
  pauseRecording,
  resumeRecording,
  startRecording,
  stopRecording,
  stopTrackStream,
  type FinalizedRecording,
  type RecordingResult,
} from './capabilities';
import { sessionStore } from './store';
import type { Track } from './types';

// --- Actions ---
// Each action is named and exported so tests can exercise state
// transitions directly, independent of the effect wrapper.

// Runs as `onStart` of the start-recording effect — before the picker
// dialog opens. Moves into the transient `starting` state so the UI
// can lock the start button while `getDisplayMedia` is pending; that
// keeps a slow dialog or double-click from spawning a second start
// effect whose handlers would race the first. Capture itself happens
// in the capability; the recording state is set up in
// `setRecordingContext` (onSuccess).
export const markStarting = defineAction([sessionStore], (session) => {
  session.status = 'starting';
  session.error = null;
});

export const setRecordingContext = defineAction(
  [sessionStore, timerStore],
  (session, timer, result: RecordingResult) => {
    session.status = 'recording';
    session.tracks = result.tracks;
    session.streams = result.streams;
    session.recorder = result.recorder;
    session.chunks = result.chunks;
    timer.elapsed = 0;
    timer.startedAt = Date.now();
  },
);

export const markError = defineAction(
  [sessionStore],
  (session, error: Error) => {
    session.status = 'error';
    session.error = error.message;
  },
);

// `Date.now()` reads here let the timer freeze at the precise wall-clock
// moment the user paused/stopped, instead of relying on the next tick to
// land. The reads stay scoped to where the lifecycle decision happens.
const captureElapsed = (timer: {
  elapsed: number;
  startedAt: number | null;
}): void => {
  if (timer.startedAt !== null) {
    timer.elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
  }
  timer.startedAt = null;
};

export const beginStop = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'stopping';
    captureElapsed(timer);
  },
);

export const finalizeRecording = defineAction(
  [sessionStore, libraryStore],
  (session, library, result: FinalizedRecording) => {
    session.status = 'idle';
    session.tracks = [];
    session.error = null;
    session.streams = {};
    session.recorder = null;
    session.chunks = null;
    session.lastFinalizedId = result.id;
    library.recordings.push({
      id: result.id,
      name: result.name,
      duration: result.duration,
      createdAt: result.createdAt,
      url: result.url,
    });
  },
);

export const beginPause = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'paused';
    captureElapsed(timer);
  },
);

export const beginResume = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'recording';
    timer.startedAt = Date.now() - timer.elapsed * 1000;
  },
);

export const appendTrack = defineAction(
  [sessionStore],
  (session, input: { track: Track; stream: MediaStream }) => {
    session.tracks.push(input.track);
    session.streams[input.track.id] = input.stream;
  },
);

export const removeTrackFromState = defineAction(
  [sessionStore],
  (session, trackId: string) => {
    const index = session.tracks.findIndex((track) => track.id === trackId);
    if (index !== -1) session.tracks.splice(index, 1);
    delete session.streams[trackId];
  },
);

export const markSupport = defineAction(
  [sessionStore],
  (session, supported: boolean) => {
    if (!supported) session.status = 'unsupported';
  },
);

// --- Effects ---
//
// Each effect declares the stores it reads and hands the capability
// straight through. No de-Ref or field-extraction wrappers — capabilities
// accept the same structural views the effect runtime provides.

/** Start screen capture and wire the session + timer into recording state. */
export const startRecordingEffect = defineEffect([], startRecording, {
  onStart: markStarting,
  onSuccess: setRecordingContext,
  onFailure: markError,
});

/** Stop the active recording. Success appends to library and clears refs. */
export const stopRecordingEffect = defineEffect(
  [sessionStore, timerStore],
  stopRecording,
  { onStart: beginStop, onSuccess: finalizeRecording, onFailure: markError },
);

/** Pause the recorder and freeze the timer. */
export const pauseRecordingEffect = defineEffect(
  [sessionStore],
  pauseRecording,
  { onStart: beginPause, onFailure: markError },
);

/** Resume the recorder without resetting elapsed. */
export const resumeRecordingEffect = defineEffect(
  [sessionStore],
  resumeRecording,
  { onStart: beginResume, onFailure: markError },
);

/** Capture a new track mid-session and append it to state. */
export const addTrackEffect = defineEffect([sessionStore], captureTrack, {
  onSuccess: appendTrack,
  onFailure: markError,
});

/** Stop a track's stream and drop it from state. */
export const removeTrackEffect = defineEffect([sessionStore], stopTrackStream, {
  onSuccess: removeTrackFromState,
  onFailure: markError,
});

/** Probe screen-capture support once and mark the session unsupported if missing. */
export const checkSupportEffect = defineEffect([], checkSupport, {
  onSuccess: markSupport,
});
