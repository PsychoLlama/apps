import { defineAction, defineEffect } from '#state';
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

// Recording names are built from when the recording ended.
const recordingNameFormat = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

// --- Actions ---
// Each action is named and exported so tests can exercise state
// transitions directly, independent of the effect wrapper.

export const beginRecording = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'recording';
    session.error = null;
    timer.running = true;
    timer.elapsed = 0;
  },
);

export const setRecordingContext = defineAction(
  [sessionStore],
  (session, result: RecordingResult) => {
    session.tracks = result.tracks;
    session.streams = result.streams;
    session.recorder = result.recorder;
    session.chunks = result.chunks;
  },
);

export const markError = defineAction(
  [sessionStore],
  (session, error: Error) => {
    session.status = 'error';
    session.error = error.message;
  },
);

export const beginStop = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'stopping';
    timer.running = false;
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
    library.recordings.push({
      id: result.id,
      name: recordingNameFormat.format(new Date(result.stoppedAt)),
      duration: result.elapsed,
      createdAt: result.stoppedAt,
      url: result.url,
    });
  },
);

export const beginPause = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'paused';
    timer.running = false;
  },
);

export const beginResume = defineAction(
  [sessionStore, timerStore],
  (session, timer) => {
    session.status = 'recording';
    timer.running = true;
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
  onStart: beginRecording,
  onSuccess: setRecordingContext,
  onFailure: markError,
});

/** Stop the active recording. Success appends to library and clears refs. */
export const stopRecordingEffect = defineEffect(
  [sessionStore, timerStore],
  stopRecording,
  { onStart: beginStop, onSuccess: finalizeRecording },
);

/** Pause the recorder and freeze the timer. */
export const pauseRecordingEffect = defineEffect(
  [sessionStore],
  pauseRecording,
  { onStart: beginPause },
);

/** Resume the recorder without resetting elapsed. */
export const resumeRecordingEffect = defineEffect(
  [sessionStore],
  resumeRecording,
  { onStart: beginResume },
);

/** Capture a new track mid-session and append it to state. */
export const addTrackEffect = defineEffect([sessionStore], captureTrack, {
  onSuccess: appendTrack,
});

/** Stop a track's stream and drop it from state. */
export const removeTrackEffect = defineEffect([sessionStore], stopTrackStream, {
  onSuccess: removeTrackFromState,
});

/** Probe screen-capture support once and mark the session unsupported if missing. */
export const checkSupportEffect = defineEffect([], checkSupport, {
  onSuccess: markSupport,
});
