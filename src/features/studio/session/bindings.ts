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
  (s, t) => {
    s.status = 'recording';
    s.error = null;
    t.running = true;
    t.elapsed = 0;
  },
);

export const setRecordingContext = defineAction(
  [sessionStore],
  (s, result: RecordingResult) => {
    s.tracks = result.tracks;
    s.streams = Object.fromEntries(
      Object.entries(result.streams).map(([id, stream]) => [id, ref(stream)]),
    );
    s.recorder = ref(result.recorder);
    s.chunks = ref(result.chunks);
  },
);

export const markError = defineAction([sessionStore], (s, error: Error) => {
  s.status = 'error';
  s.error = error.message;
});

export const beginStop = defineAction([sessionStore, timerStore], (s, t) => {
  s.status = 'idle';
  s.tracks = [];
  s.error = null;
  t.running = false;
});

export const finalizeRecording = defineAction(
  [sessionStore, libraryStore],
  (s, l, result: FinalizedRecording) => {
    s.streams = {};
    s.recorder = null;
    s.chunks = null;
    l.recordings.push({
      id: result.id,
      name: `Recording ${l.recordings.length + 1}`,
      duration: result.elapsed,
      createdAt: result.stoppedAt,
      url: result.url,
    });
  },
);

export const beginPause = defineAction([sessionStore, timerStore], (s, t) => {
  s.status = 'paused';
  t.running = false;
});

export const beginResume = defineAction([sessionStore, timerStore], (s, t) => {
  s.status = 'recording';
  t.running = true;
});

export const appendTrack = defineAction(
  [sessionStore],
  (s, input: { track: Track; stream: MediaStream }) => {
    s.tracks.push(input.track);
    s.streams[input.track.id] = ref(input.stream);
  },
);

export const removeTrackFromState = defineAction(
  [sessionStore],
  (s, trackId: string) => {
    const index = s.tracks.findIndex((t) => t.id === trackId);
    if (index !== -1) s.tracks.splice(index, 1);
    delete s.streams[trackId];
  },
);

export const markUnsupportedIf = defineAction(
  [sessionStore],
  (s, supported: boolean) => {
    if (!supported) s.status = 'unsupported';
  },
);

// --- Effects ---

function unwrapStreams(
  streams: Record<string, unknown>,
): Record<string, MediaStream> {
  return Object.fromEntries(
    Object.entries(streams).map(([id, r]) => [
      id,
      (r as Ref<MediaStream>).current,
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
