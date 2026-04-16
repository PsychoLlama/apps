import { defineActivity } from '#state';
import type { Track } from './types';
import { createSession, destroySession, getSession } from './media-registry';

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

/** Acquires screen capture via getDisplayMedia. Returns tracks and registers streams. */
export const captureScreen = defineActivity({}, async (): Promise<Track[]> => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  const session = createSession();
  const tracks: Track[] = [];

  for (const mediaTrack of stream.getTracks()) {
    const id = crypto.randomUUID();
    const type = mediaTrack.kind === 'video' ? 'screen' : 'system-audio';
    const label =
      mediaTrack.label || (type === 'screen' ? 'Screen' : 'System Audio');

    const trackStream = new MediaStream([mediaTrack]);
    session.streams.set(id, trackStream);
    tracks.push({ id, type, label, live: true });
  }

  return tracks;
});

/** Acquires an additional media track (microphone or tab audio). */
export const captureTrack = defineActivity(
  {},
  async (type: 'microphone' | 'tab'): Promise<Track> => {
    const stream =
      type === 'microphone'
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: true,
          });

    const session = getSession();
    if (!session) throw new Error('No active recording session');

    const mediaTrack = stream.getTracks()[0];
    const id = crypto.randomUUID();
    const label =
      mediaTrack.label || (type === 'microphone' ? 'Microphone' : 'Tab Audio');

    session.streams.set(id, stream);
    return { id, type, label, live: true };
  },
);

/** Combines all registered streams and starts a MediaRecorder. */
export const createRecorder = defineActivity({}, () => {
  const session = getSession();
  if (!session) throw new Error('No active recording session');

  const combined = new MediaStream();
  for (const stream of session.streams.values()) {
    for (const track of stream.getTracks()) {
      combined.addTrack(track);
    }
  }

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(combined, { mimeType });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) session.chunks.push(e.data);
  };

  session.recorder = recorder;
  recorder.start(1000);
});

/** Pauses the active MediaRecorder. */
export const pauseRecorder = defineActivity({}, () => {
  const session = getSession();
  session?.recorder?.pause();
});

/** Resumes the active MediaRecorder. */
export const resumeRecorder = defineActivity({}, () => {
  const session = getSession();
  session?.recorder?.resume();
});

/** Stops the MediaRecorder and produces a Blob from collected chunks. */
export const stopRecorder = defineActivity({}, (): Promise<Blob> => {
  const session = getSession();
  if (!session?.recorder) throw new Error('No active recorder');

  const recorder = session.recorder;
  return new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(session.chunks, { type: recorder.mimeType });
      destroySession();
      resolve(blob);
    };
    recorder.stop();
  });
});

/** Creates a blob URL for download. */
export const createBlobUrl = defineActivity({}, (blob: Blob) =>
  URL.createObjectURL(blob),
);

/** Stops a specific stream's tracks and removes it from the registry. */
export const removeMediaStream = defineActivity({}, (trackId: string) => {
  const session = getSession();
  if (!session) return;

  const stream = session.streams.get(trackId);
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
    session.streams.delete(trackId);
  }
});

/** Registers a callback for when the primary video track ends externally (e.g. "Stop sharing"). */
export const watchStreamEnd = defineActivity(
  {},
  (trackId: string, onEnded: () => void) => {
    const session = getSession();
    if (!session) return;

    const stream = session.streams.get(trackId);
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', onEnded, { once: true });
    }

    session.onStreamEnded = onEnded;
  },
);
