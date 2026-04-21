import { ref, type Ref } from '#state';
import type { Track } from './types';

export interface RecordingContext {
  readonly tracks: Track[];
  readonly streams: Record<string, Ref<MediaStream>>;
  readonly recorder: Ref<MediaRecorder>;
  readonly chunks: Ref<Blob[]>;
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
 * Start screen capture and build a recorder. Arms an `ended` listener on
 * the primary video track so the caller can react to the user clicking
 * the browser's "Stop sharing" affordance.
 */
export async function startRecording(
  onStreamEnded: () => void,
): Promise<RecordingContext> {
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
}

/** Drain the recorder into a Blob, release every stream, produce a blob URL. */
export async function stopRecording(
  recorder: MediaRecorder,
  chunks: Blob[],
  streams: Record<string, Ref<MediaStream>>,
  elapsed: number,
): Promise<FinalizedRecording> {
  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob([...chunks], { type: recorder.mimeType }));
    };
    recorder.stop();
  });

  for (const streamRef of Object.values(streams)) {
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
}

/** Pause the recorder. No-op when missing. */
export function pauseRecording(recorder: MediaRecorder | undefined): void {
  recorder?.pause();
}

/** Resume the recorder. No-op when missing. */
export function resumeRecording(recorder: MediaRecorder | undefined): void {
  recorder?.resume();
}

/** Capture an additional media track (microphone or tab audio). */
export async function captureTrack(
  type: 'microphone' | 'tab',
): Promise<{ track: Track; streamRef: Ref<MediaStream> }> {
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
}

/** Stop all tracks on a stream. Returns the id for lifecycle chaining. */
export function stopTrackStream(
  streamRef: Ref<MediaStream> | undefined,
  trackId: string,
): string {
  if (streamRef) {
    for (const track of streamRef.current.getTracks()) {
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
