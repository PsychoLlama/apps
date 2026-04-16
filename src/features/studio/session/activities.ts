import { defineActivity, ref, type Ref } from '#state';
import type { Track } from './types';
import { useSession } from './ambient';

/** Returns the current timestamp. */
export const currentTime = defineActivity({}, () => Date.now());

/** Generates a unique ID. */
export const generateId = defineActivity({}, () => crypto.randomUUID());

/** Checks whether the browser supports screen capture. */
export const checkScreenCaptureSupport = defineActivity(
  {},
  () =>
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices,
);

/**
 * Acquires screen capture via getDisplayMedia. Returns track descriptors
 * and per-track stream refs for the session store to hold.
 */
export const captureScreen = defineActivity(
  {},
  async (): Promise<{
    tracks: Track[];
    streams: Record<string, Ref<MediaStream>>;
  }> => {
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

    return { tracks, streams };
  },
);

/** Acquires an additional media track (microphone or tab audio). */
export const captureTrack = defineActivity(
  {},
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
);

/**
 * Combines all session streams into a MediaRecorder. Returns refs for
 * the recorder and the accumulating chunks array — the session store
 * holds both for later stop/release activities to read back.
 */
export const createRecorder = defineActivity(
  {},
  (
    streams: Record<string, Ref<MediaStream>>,
  ): { recorder: Ref<MediaRecorder>; chunks: Ref<Blob[]> } => {
    const combined = new MediaStream();
    for (const streamRef of Object.values(streams)) {
      for (const track of streamRef.current.getTracks()) {
        combined.addTrack(track);
      }
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(combined, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.start(1000);

    return { recorder: ref(recorder), chunks: ref(chunks) };
  },
);

/** Pauses the active MediaRecorder. */
export const pauseRecorder = defineActivity({}, () => {
  useSession().recorder?.current.pause();
});

/** Resumes the active MediaRecorder. */
export const resumeRecorder = defineActivity({}, () => {
  useSession().recorder?.current.resume();
});

/** Stops the MediaRecorder and produces a Blob from collected chunks. */
export const stopRecorder = defineActivity({}, (): Promise<Blob> => {
  const recorder = useSession().recorder?.current;
  const chunks = useSession().chunks?.current;
  if (!recorder || !chunks) throw new Error('No active recorder');

  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType }));
    };
    recorder.stop();
  });
});

/** Creates a blob URL for download. */
export const createBlobUrl = defineActivity({}, (blob: Blob) =>
  URL.createObjectURL(blob),
);

/** Stops all tracks in every session stream. */
export const releaseSession = defineActivity({}, () => {
  for (const streamRef of Object.values(useSession().streams)) {
    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }
  }
});

/** Stops a specific stream's tracks. */
export const stopStream = defineActivity({}, (trackId: string) => {
  const streamRef = useSession().streams[trackId];
  if (!streamRef) return;
  for (const track of streamRef.current.getTracks()) {
    track.stop();
  }
});

/** Attaches an `ended` listener to the primary video track (fires when the user clicks the browser's "Stop sharing"). */
export const watchStreamEnd = defineActivity(
  {},
  (streamRef: Ref<MediaStream>, onEnded: () => void) => {
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', onEnded, { once: true });
    }
  },
);
