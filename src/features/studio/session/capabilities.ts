import type { DeepReadonly } from '#state';
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
  readonly elapsed: number;
  readonly stoppedAt: number;
  readonly url: string;
}

const preferredMimeType = (): string =>
  MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

function createRecorder(streams: Record<string, MediaStream>): {
  recorder: MediaRecorder;
  chunks: Blob[];
} {
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
}

/**
 * Start screen capture and build a recorder. Arms an `ended` listener on
 * the primary video track so the caller can react to the user clicking
 * the browser's "Stop sharing" affordance.
 */
export async function startRecording(
  onStreamEnded: () => void,
): Promise<RecordingResult> {
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
    tracks.push({ id, type, label, live: true });
  }

  const { recorder, chunks } = createRecorder(streams);

  const videoTrack = tracks.find((track) => track.type === 'screen');
  if (videoTrack) {
    streams[videoTrack.id]
      .getVideoTracks()[0]
      ?.addEventListener('ended', onStreamEnded, { once: true });
  }

  return { tracks, streams, recorder, chunks };
}

/**
 * Drain the active recorder into a Blob, release every stream, and
 * produce a blob URL. Pulls recorder/chunks/streams and elapsed directly
 * off the state views handed in by the effect.
 */
export async function stopRecording(
  session: DeepReadonly<SessionState>,
  timer: DeepReadonly<TimerState>,
): Promise<FinalizedRecording> {
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

  return {
    id: crypto.randomUUID(),
    elapsed: timer.elapsed,
    stoppedAt: Date.now(),
    url: URL.createObjectURL(blob),
  };
}

/** Pause the active recorder. No-op when none is running. */
export function pauseRecording(session: DeepReadonly<SessionState>): void {
  session.recorder?.pause();
}

/** Resume the active recorder. No-op when none is running. */
export function resumeRecording(session: DeepReadonly<SessionState>): void {
  session.recorder?.resume();
}

/** Capture a new microphone track. */
export async function captureTrack(): Promise<{
  track: Track;
  stream: MediaStream;
}> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaTrack = stream.getTracks()[0];
  const id = crypto.randomUUID();
  const label = mediaTrack.label || 'Microphone';
  return {
    track: { id, type: 'microphone', label, live: true },
    stream,
  };
}

/** Stop a track's stream and return the id for lifecycle chaining. */
export function stopTrackStream(
  session: DeepReadonly<SessionState>,
  trackId: string,
): string {
  const stream = session.streams[trackId];
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  return trackId;
}

/** Probe whether the browser supports screen capture. */
export function checkSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getDisplayMedia' in navigator.mediaDevices
  );
}
