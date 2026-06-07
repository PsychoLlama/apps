import { requestDecode } from './decoder';
import type { ScanResult } from './store';
import { onVideoFrame } from './video-frames';

/**
 * Build a sampler bound to one `<video>` and decoder source. Each call
 * grabs the current frame, decodes it, and on a hit reports the result and
 * fires `onHit` (used to halt the loop). The returned promise settles when
 * the frame does — and resolves immediately when the frame is skipped (no
 * decoder yet, or one already in flight) — giving callers a definite point
 * to await.
 *
 * The decoder is resolved per call via `getDecoder` rather than captured up
 * front: the worker preloads asynchronously, so it may not be ready when
 * sampling starts. Frames taken before it lands are skipped; decoding
 * begins on the first frame after the worker attaches.
 */
export const createFrameSampler = (
  video: HTMLVideoElement,
  getDecoder: () => Worker | undefined,
  onResult: (result: ScanResult) => void,
  onHit: () => void,
): (() => Promise<void>) => {
  // Back-pressure: hold a single frame in flight so we never queue decodes
  // faster than the worker drains them. Frames taken while one is pending
  // are skipped — the next tick grabs a fresher one anyway.
  let inFlight = false;

  return async () => {
    const decoder = getDecoder();
    if (inFlight || !decoder) return;
    inFlight = true;
    try {
      const result = await requestDecode(
        decoder,
        await createImageBitmap(video),
      );
      if (result) {
        onResult(result);
        onHit();
      }
    } catch {
      // A dropped frame (grab failed, worker mid-teardown) is no cause for
      // alarm — the next tick tries again.
    } finally {
      inFlight = false;
    }
  };
};

/**
 * Run the decode loop against a live `<video>`: sample frames, hand each
 * to the decoder worker one at a time, and report the first recognized
 * code through `onResult` — then stop sampling. The feed keeps streaming,
 * so the user stays oriented after a hit. Returns an unsubscribe that
 * halts sampling early (e.g. on unmount).
 */
export const startCaptureLoop = (
  video: HTMLVideoElement,
  getDecoder: () => Worker | undefined,
  onResult: (result: ScanResult) => void,
): (() => void) => {
  const sample = createFrameSampler(video, getDecoder, onResult, () =>
    unsubscribe(),
  );
  const unsubscribe = onVideoFrame(video, () => void sample());
  return unsubscribe;
};
