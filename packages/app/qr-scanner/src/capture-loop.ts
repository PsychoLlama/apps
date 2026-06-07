import { requestDecode } from './decoder';
import type { ScanResult } from './store';
import { onVideoFrame } from './video-frames';

/**
 * Run the decode loop against a live `<video>`: sample frames, hand each
 * to the decoder worker one at a time, and report the first recognized
 * code through `onResult` — then stop sampling. The feed keeps streaming,
 * so the user stays oriented after a hit. Returns an unsubscribe that
 * halts sampling early (e.g. on unmount).
 *
 * The decoder is resolved per frame via `getDecoder` rather than captured
 * up front: the worker preloads asynchronously, so it may not be ready
 * when sampling starts. Frames sampled before it lands are skipped, and
 * decoding begins on the first frame after the worker attaches.
 */
export const startCaptureLoop = (
  video: HTMLVideoElement,
  getDecoder: () => Worker | undefined,
  onResult: (result: ScanResult) => void,
): (() => void) => {
  // Back-pressure: hold a single frame in flight so we never queue
  // decodes faster than the worker drains them. Frames sampled while one
  // is pending are skipped — the next tick grabs a fresher one anyway.
  let inFlight = false;

  const unsubscribe = onVideoFrame(video, () => {
    const decoder = getDecoder();
    if (inFlight || !decoder) return;
    inFlight = true;
    void (async () => {
      try {
        const result = await requestDecode(
          decoder,
          await createImageBitmap(video),
        );
        if (result) {
          onResult(result);
          unsubscribe();
        }
      } catch {
        // A dropped frame (grab failed, worker mid-teardown) is no cause
        // for alarm — the next tick tries again.
      } finally {
        inFlight = false;
      }
    })();
  });

  return unsubscribe;
};
