import { defineAction, defineEffect, type Ref } from '#state';
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
  type RecordingContext,
} from './capabilities';
import { session, sessionStore } from './store';
import type { Track } from './types';

// --- Actions ---
// TS can't infer the `Stores` tuple when `defineAction` is called as an
// argument to `defineEffect`, so each action is a named const referenced
// by the effect below. Exported so action-level tests can exercise state
// transitions directly without routing through the effect's impure
// callback (which often closes over the module-level `session` view on
// GLOBAL_REGISTRY and fails against a per-test registry).

export const beginRecording = defineAction(
  [sessionStore, timerStore],
  (s, t, input: unknown) => {
    void input;
    s.status = 'recording';
    s.error = null;
    t.running = true;
    t.elapsed = 0;
  },
);

export const setRecordingContext = defineAction(
  [sessionStore],
  (s, context: RecordingContext) => {
    s.tracks = context.tracks;
    s.streams = context.streams;
    s.recorder = context.recorder;
    s.chunks = context.chunks;
  },
);

export const markError = defineAction([sessionStore], (s, error: Error) => {
  s.status = 'error';
  s.error = error.message;
});

export const beginStop = defineAction(
  [sessionStore, timerStore],
  (s, t, input: unknown) => {
    void input;
    s.status = 'idle';
    s.tracks = [];
    s.error = null;
    t.running = false;
  },
);

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
  (s, input: { track: Track; streamRef: Ref<MediaStream> }) => {
    s.tracks.push(input.track);
    s.streams[input.track.id] = input.streamRef;
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

/** Start screen capture and wire the session + timer into recording state. */
export const startRecordingEffect = defineEffect(startRecording, {
  onStart: beginRecording,
  onSuccess: setRecordingContext,
  onFailure: markError,
});

/** Stop the active recording. Success appends to library and clears refs. */
export const stopRecordingEffect = defineEffect(
  async (elapsed: number): Promise<FinalizedRecording> => {
    // Cast through DeepReadonly: `Ref<MediaRecorder>` holds a live host
    // object, and the capability needs to mutate `onstop` and splice the
    // chunks buffer.
    const recorder = session.recorder?.current as MediaRecorder | undefined;
    const chunks = session.chunks?.current as Blob[] | undefined;
    if (!recorder || !chunks) throw new Error('No active recorder');
    return stopRecording(
      recorder,
      chunks,
      session.streams as Record<string, Ref<MediaStream>>,
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
    const streamRef = session.streams[trackId] as Ref<MediaStream> | undefined;
    return stopTrackStream(streamRef, trackId);
  },
  { onSuccess: removeTrackFromState },
);

/** Probe screen-capture support once and mark the session unsupported if missing. */
export const checkSupportEffect = defineEffect(checkSupport, {
  onSuccess: markUnsupportedIf,
});
