/**
 * Minimum gap between frame grabs, in milliseconds — a soft cap of
 * ≈8–10 fps. A QR code is static while the user steadies the phone, so
 * decoding every compositor frame just burns CPU and battery (and heats
 * the device) for no extra recognition. Back-pressure in the capture
 * loop tightens this further whenever a decode runs long.
 */
export const MIN_FRAME_INTERVAL_MS = 100;

/**
 * Subscribe to live video frames, invoking `callback` no more often than
 * {@link MIN_FRAME_INTERVAL_MS}. Returns an unsubscribe.
 *
 * Prefers `requestVideoFrameCallback` — it fires once per *new* decoded
 * frame, so we never re-process a duplicate and idle automatically when
 * the feed stalls. Where it's absent (it's progressive enhancement, not
 * baseline), it degrades to a `setInterval` timer at the same cadence.
 */
export const onVideoFrame = (
  video: HTMLVideoElement,
  callback: () => void,
): (() => void) => {
  let stopped = false;

  if (typeof video.requestVideoFrameCallback === 'function') {
    let lastFrame = -Infinity;
    let handle = 0;

    // rVFC hands us the frame's timestamp; throttle on it rather than a
    // wall clock so the cap tracks actual frame delivery.
    const tick = (now: DOMHighResTimeStamp) => {
      if (stopped) return;
      if (now - lastFrame >= MIN_FRAME_INTERVAL_MS) {
        lastFrame = now;
        callback();
      }
      handle = video.requestVideoFrameCallback(tick);
    };

    handle = video.requestVideoFrameCallback(tick);
    return () => {
      stopped = true;
      video.cancelVideoFrameCallback?.(handle);
    };
  }

  const timer = setInterval(() => {
    if (!stopped) callback();
  }, MIN_FRAME_INTERVAL_MS);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
};
