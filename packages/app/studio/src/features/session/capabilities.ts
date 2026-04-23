import type { DeepReadonly } from '@lib/state';
import { persistRecording } from '../library/capabilities';
import { formatRecordingName } from '../format';
import type { SessionState } from './store';
import type { TimerState } from '../timer/store';
import type { Track } from './types';

export interface RecordingResult {
  readonly tracks: Track[];
  readonly streams: Record<string, MediaStream>;
  readonly recorder: MediaRecorder;
  readonly chunks: Blob[];
}

export interface FinalizedRecording {
  readonly id: string;
  readonly name: string;
  readonly duration: number;
  readonly createdAt: number;
  readonly url: string;
}

const preferredMimeType = (): string =>
  MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

const createRecorder = (
  streams: Record<string, MediaStream>,
): {
  recorder: MediaRecorder;
  chunks: Blob[];
} => {
  const combined = new MediaStream();
  for (const stream of Object.values(streams)) {
    for (const track of stream.getTracks()) {
      combined.addTrack(track);
    }
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combined, {
    mimeType: preferredMimeType(),
  });
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.start(1000);

  return { recorder, chunks };
};

/**
 * Start screen capture and build a recorder. Arms an `ended` listener on
 * the primary video track so the caller can react to the user clicking
 * the browser's "Stop sharing" affordance.
 */
export const startRecording = async (
  onStreamEnded: () => void,
): Promise<RecordingResult> => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

  const tracks: Track[] = [];
  const streams: Record<string, MediaStream> = {};

  for (const mediaTrack of stream.getTracks()) {
    const id = crypto.randomUUID();
    const type = mediaTrack.kind === 'video' ? 'screen' : 'system-audio';
    const label =
      mediaTrack.label || (type === 'screen' ? 'Screen' : 'System Audio');
    streams[id] = new MediaStream([mediaTrack]);
    tracks.push({ id, type, label });
  }

  const { recorder, chunks } = createRecorder(streams);

  const videoTrack = tracks.find((track) => track.type === 'screen');
  if (videoTrack) {
    streams[videoTrack.id]
      .getVideoTracks()[0]
      ?.addEventListener('ended', onStreamEnded, { once: true });
  }

  return { tracks, streams, recorder, chunks };
};

/**
 * Drain the active recorder into a Blob, release every stream, mint a
 * blob URL, and best-effort persist the recording to IndexedDB. The
 * URL is minted before the persist so a save failure (e.g. quota) does
 * not throw away a finished capture — the user keeps an in-session
 * playable recording even when disk is unavailable. Persist errors are
 * surfaced through the console; subsequent reloads will simply not see
 * the recording in the library.
 */
export const stopRecording = async (
  session: DeepReadonly<SessionState>,
  timer: DeepReadonly<TimerState>,
): Promise<FinalizedRecording> => {
  const { recorder, chunks, streams } = session;
  if (!recorder || !chunks) throw new Error('No active recorder');

  const blob = await new Promise<Blob>((resolve) => {
    recorder.addEventListener(
      'stop',
      () => resolve(new Blob([...chunks], { type: recorder.mimeType })),
      { once: true },
    );
    recorder.stop();
  });

  for (const stream of Object.values(streams)) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const name = formatRecordingName(createdAt);
  const duration = timer.elapsed;
  const url = URL.createObjectURL(blob);

  try {
    await persistRecording({ id, name, duration, createdAt, blob });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to persist recording to IndexedDB', error);
  }

  return { id, name, duration, createdAt, url };
};

/** Pause the active recorder. No-op when none is running. */
export const pauseRecording = (session: DeepReadonly<SessionState>): void => {
  session.recorder?.pause();
};

/** Resume the active recorder. No-op when none is running. */
export const resumeRecording = (session: DeepReadonly<SessionState>): void => {
  session.recorder?.resume();
};

/**
 * Capture a new microphone track and splice it into the live recorder's
 * combined stream so the new audio actually lands in the output blob.
 * Without the splice, the track would only show up in the UI.
 */
export const captureTrack = async (
  session: DeepReadonly<SessionState>,
): Promise<{ track: Track; stream: MediaStream }> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaTrack = stream.getTracks()[0];
  if (session.recorder) {
    for (const liveTrack of stream.getTracks()) {
      session.recorder.stream.addTrack(liveTrack);
    }
  }
  const id = crypto.randomUUID();
  const label = mediaTrack.label || 'Microphone';
  return {
    track: { id, type: 'microphone', label },
    stream,
  };
};

/**
 * Detach a track from the recorder's combined stream and stop its source.
 * Returns the id so the success action can drop it from state.
 */
export const stopTrackStream = (
  session: DeepReadonly<SessionState>,
  trackId: string,
): string => {
  const stream = session.streams[trackId];
  if (stream) {
    for (const track of stream.getTracks()) {
      session.recorder?.stream.removeTrack(track);
      track.stop();
    }
  }
  return trackId;
};

/** Probe whether the browser supports screen capture. */
export const checkSupport = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices
  );
};
