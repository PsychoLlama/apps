import { ref, type Ref } from '#state';
import { defineEffect } from '#state';
import {
  appendTrack,
  beginPause,
  beginRecording,
  beginResume,
  beginStop,
  finalizeRecording,
  markError,
  markUnsupportedIf,
  removeTrackFromState,
  setRecordingContext,
  type FinalizedRecording,
  type RecordingContext,
} from './actions';
import { session } from './store';
import type { Track } from './types';

const preferredMimeType = (): string =>
  MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

/** Combine every live stream into a new MediaRecorder. Returns opaque refs. */
function createRecorder(streams: Record<string, Ref<MediaStream>>): {
  recorder: Ref<MediaRecorder>;
  chunks: Ref<Blob[]>;
} {
  const combined = new MediaStream();
  for (const streamRef of Object.values(streams)) {
    for (const track of streamRef.current.getTracks()) {
      combined.addTrack(track);
    }
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combined, {
    mimeType: preferredMimeType(),
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start(1000);

  return { recorder: ref(recorder), chunks: ref(chunks) };
}

/**
 * Start a recording session. Captures the screen, builds a recorder, and
 * arms an `ended` listener so the user clicking "Stop sharing" in the
 * browser UI triggers the caller-supplied callback.
 */
export const startRecordingEffect = defineEffect(
  async (onStreamEnded: () => void): Promise<RecordingContext> => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const tracks: Track[] = [];
    const streams: Record<string, Ref<MediaStream>> = {};

    for (const mediaTrack of stream.getTracks()) {
      const id = crypto.randomUUID();
      const type = mediaTrack.kind === 'video' ? 'screen' : 'system-audio';
      const label =
        mediaTrack.label || (type === 'screen' ? 'Screen' : 'System Audio');
      streams[id] = ref(new MediaStream([mediaTrack]));
      tracks.push({ id, type, label, live: true });
    }

    const { recorder, chunks } = createRecorder(streams);

    const videoTrack = tracks.find((t) => t.type === 'screen');
    if (videoTrack) {
      streams[videoTrack.id].current
        .getVideoTracks()[0]
        ?.addEventListener('ended', onStreamEnded, { once: true });
    }

    return { tracks, streams, recorder, chunks };
  },
  {
    onStart: beginRecording,
    onSuccess: setRecordingContext,
    onFailure: markError,
  },
);

/**
 * Stop the active recording. Drains the recorder, releases all streams,
 * and produces a blob URL for download. `onSuccess` clears session refs
 * and appends the recording to the library in one atomic update.
 */
export const stopRecordingEffect = defineEffect(
  async (elapsed: number): Promise<FinalizedRecording> => {
    // Cast through the DeepReadonly view: `Ref<MediaRecorder>` holds a
    // live host object and we legitimately need to mutate `onstop` /
    // spread the chunks buffer into a fresh Blob.
    const recorder = session.recorder?.current as MediaRecorder | undefined;
    const chunks = session.chunks?.current as Blob[] | undefined;
    if (!recorder || !chunks) throw new Error('No active recorder');

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob([...chunks], { type: recorder.mimeType }));
      };
      recorder.stop();
    });

    for (const streamRef of Object.values(session.streams)) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }

    return {
      id: crypto.randomUUID(),
      elapsed,
      stoppedAt: Date.now(),
      url: URL.createObjectURL(blob),
    };
  },
  {
    onStart: beginStop,
    onSuccess: finalizeRecording,
  },
);

/** Pause the MediaRecorder. */
export const pauseRecordingEffect = defineEffect(
  (): void => {
    session.recorder?.current.pause();
  },
  { onStart: beginPause },
);

/** Resume the MediaRecorder. */
export const resumeRecordingEffect = defineEffect(
  (): void => {
    session.recorder?.current.resume();
  },
  { onStart: beginResume },
);

/** Capture an additional media track (microphone or tab audio). */
export const addTrackEffect = defineEffect(
  async (
    type: 'microphone' | 'tab',
  ): Promise<{ track: Track; streamRef: Ref<MediaStream> }> => {
    const stream =
      type === 'microphone'
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: true,
          });

    const mediaTrack = stream.getTracks()[0];
    const id = crypto.randomUUID();
    const label =
      mediaTrack.label || (type === 'microphone' ? 'Microphone' : 'Tab Audio');

    return {
      track: { id, type, label, live: true },
      streamRef: ref(stream),
    };
  },
  { onSuccess: appendTrack },
);

/** Stop a specific track's stream, then remove it from state. */
export const removeTrackEffect = defineEffect(
  (trackId: string): string => {
    const streamRef = session.streams[trackId];
    if (streamRef) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
    return trackId;
  },
  { onSuccess: removeTrackFromState },
);

/** Probe whether the browser supports screen capture. */
export const checkSupportEffect = defineEffect(
  (): boolean =>
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices,
  { onSuccess: markUnsupportedIf },
);
