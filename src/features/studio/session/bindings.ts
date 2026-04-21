import { defineAction, defineEffect, ref, type Ref } from '#state';
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
import { session, sessionStore } from './store';
import type { Track } from './types';

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
    session.streams = Object.fromEntries(
      Object.entries(result.streams).map(([id, stream]) => [id, ref(stream)]),
    );
    session.recorder = ref(result.recorder);
    session.chunks = ref(result.chunks);
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
    session.status = 'idle';
    session.tracks = [];
    session.error = null;
    timer.running = false;
  },
);

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
    session.streams[input.track.id] = ref(input.stream);
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

export const markUnsupportedIf = defineAction(
  [sessionStore],
  (session, supported: boolean) => {
    if (!supported) session.status = 'unsupported';
  },
);

// --- Effects ---

function unwrapStreams(
  streams: Record<string, unknown>,
): Record<string, MediaStream> {
  return Object.fromEntries(
    Object.entries(streams).map(([id, wrapped]) => [
      id,
      (wrapped as Ref<MediaStream>).current,
    ]),
  );
}

/** Start screen capture and wire the session + timer into recording state. */
export const startRecordingEffect = defineEffect(startRecording, {
  onStart: beginRecording,
  onSuccess: setRecordingContext,
  onFailure: markError,
});

/** Stop the active recording. Success appends to library and clears refs. */
export const stopRecordingEffect = defineEffect(
  async (elapsed: number): Promise<FinalizedRecording> => {
    // Cast through DeepReadonly — Ref holds live host objects.
    const recorder = session.recorder?.current as MediaRecorder | undefined;
    const chunks = session.chunks?.current as Blob[] | undefined;
    if (!recorder || !chunks) throw new Error('No active recorder');
    return stopRecording(
      recorder,
      chunks,
      unwrapStreams(session.streams),
      elapsed,
    );
  },
  {
    onStart: beginStop,
    onSuccess: finalizeRecording,
  },
);

/** Pause the recorder and freeze the timer. */
export const pauseRecordingEffect = defineEffect(
  () => pauseRecording(session.recorder?.current as MediaRecorder | undefined),
  { onStart: beginPause },
);

/** Resume the recorder without resetting elapsed. */
export const resumeRecordingEffect = defineEffect(
  () => resumeRecording(session.recorder?.current as MediaRecorder | undefined),
  { onStart: beginResume },
);

/** Capture a new track mid-session and append it to state. */
export const addTrackEffect = defineEffect(captureTrack, {
  onSuccess: appendTrack,
});

/** Stop a track's stream and drop it from state. */
export const removeTrackEffect = defineEffect(
  (trackId: string): string => {
    const stream = (session.streams[trackId] as Ref<MediaStream> | undefined)
      ?.current;
    return stopTrackStream(stream, trackId);
  },
  { onSuccess: removeTrackFromState },
);

/** Probe screen-capture support once and mark the session unsupported if missing. */
export const checkSupportEffect = defineEffect(checkSupport, {
  onSuccess: markUnsupportedIf,
});
