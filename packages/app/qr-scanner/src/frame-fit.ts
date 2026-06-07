/**
 * Cap on the decode canvas's long edge, in pixels. We scan the whole
 * frame rather than cropping to the reticle, so this sits a touch above
 * a square crop's size to keep distant codes legible without zooming —
 * large enough for rxing to resolve modules, small enough that the
 * per-frame readback and decode stay cheap on a phone.
 */
export const MAX_FRAME_EDGE = 640;

/** A `width × height` pixel size. */
export interface FrameSize {
  width: number;
  height: number;
}

/**
 * Fit a frame into the decode canvas: preserve aspect ratio and scale so
 * the long edge is at most `maxEdge`. Frames already within budget pass
 * through untouched (we never upscale). Dimensions round to whole pixels
 * and never collapse below 1, so the result is always a drawable size.
 */
export const fitDimensions = (
  width: number,
  height: number,
  maxEdge: number = MAX_FRAME_EDGE,
): FrameSize => {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };

  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};
