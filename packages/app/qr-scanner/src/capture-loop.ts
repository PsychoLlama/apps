import { requestDecode, type DecoderConnection } from './decoder';
import type { ScanResult } from './store';
import { onVideoFrame } from './video-frames';

/**
 * Build a sampler bound to one `<video>` and decoder source. Each call
 * grabs the current frame, decodes it, and on a hit reports the result and
 * fires `onHit` (used to halt the loop). The returned promise settles when
 * the frame does — and resolves immediately when the frame is skipped (no
 * decoder yet, one already in flight, or the loop aborted) — giving callers
 * a definite point to await.
 *
 * The decoder is resolved per call via `getDecoder` rather than captured up
 * front: the worker preloads asynchronously, so it may not be ready when
 * sampling starts. Frames taken before it lands are skipped; decoding
 * begins on the first frame after the worker attaches.
 *
 * `signal` is the loop's liveness token: a decode can't be cancelled once
 * on the wire, only ignored, so an aborted signal makes the sampler drop
 * any verdict that lands after teardown rather than act on a dead session.
 */
export const createFrameSampler = (
  video: HTMLVideoElement,
  getDecoder: () => DecoderConnection | undefined,
  onResult: (result: ScanResult) => void,
  onHit: () => void,
  signal: AbortSignal,
): (() => Promise<void>) => {
  // Back-pressure: hold a single frame in flight so we never queue decodes
  // faster than the worker drains them. Frames taken while one is pending
  // are skipped — the next tick grabs a fresher one anyway.
  let inFlight = false;

  return async () => {
    const decoder = getDecoder();
    if (inFlight || !decoder || signal.aborted) return;
    inFlight = true;
    try {
      const result = await requestDecode(
        decoder,
        await createImageBitmap(video),
      );
      // A decode outruns its loop: teardown (unmount, cancel, or the hit
      // that halts sampling) can't recall a worker round-trip already in
      // flight, so a verdict can land after the session it belonged to is
      // gone. Acting on it would finalize against whatever the store holds
      // now — stopping a fresh session's camera or surfacing a stale
      // result — so drop it once aborted. We don't cancel the in-flight
      // `requestDecode` itself: the worker is shared and pairs replies to
      // listeners FIFO, so retiring its listener early would let the next
      // session pick up this frame's reply. Suppressing here keeps that
      // pairing intact.
      if (result && !signal.aborted) {
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
 * code through `onResult` — then stop sampling. Returns an unsubscribe
 * that halts sampling early (e.g. on unmount, or once the consumer tears
 * the feed down after a hit).
 *
 * Stopping aborts the loop's signal as well as detaching the frame
 * callback, so a decode already in flight when the loop ends has its late
 * verdict dropped instead of finalizing against a torn-down (or freshly
 * restarted) session.
 */
export const startCaptureLoop = (
  video: HTMLVideoElement,
  getDecoder: () => DecoderConnection | undefined,
  onResult: (result: ScanResult) => void,
): (() => void) => {
  const controller = new AbortController();
  // Stopping both detaches the frame callback (no new samples) and aborts
  // the signal (in-flight verdicts are dropped). Idempotent: the hit that
  // halts the loop and the cleanup on unmount can both fire it.
  const stop = () => {
    controller.abort();
    unsubscribe();
  };
  const sample = createFrameSampler(
    video,
    getDecoder,
    onResult,
    stop,
    controller.signal,
  );
  const unsubscribe = onVideoFrame(video, () => void sample());
  return stop;
};
