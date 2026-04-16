/**
 * Imperative registry for live browser media objects.
 * Accessed only by activities — never by stores or workflows.
 */

export interface MediaSession {
  streams: Map<string, MediaStream>;
  recorder: MediaRecorder | null;
  chunks: Blob[];
  onStreamEnded: (() => void) | null;
}

let current: MediaSession | null = null;

export function getSession(): MediaSession | null {
  return current;
}

export function createSession(): MediaSession {
  current = {
    streams: new Map(),
    recorder: null,
    chunks: [],
    onStreamEnded: null,
  };
  return current;
}

export function destroySession(): void {
  if (!current) return;
  for (const stream of current.streams.values()) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  current.recorder = null;
  current.chunks = [];
  current.streams.clear();
  current.onStreamEnded = null;
  current = null;
}
