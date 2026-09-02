/** Shared pixel math for the primitive's geometry. */

/** Clamp `value` into the inclusive `[min, max]` range. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Snap to the device pixel grid. Sub-pixel translations blur text on
 * the floating element; the anchor's own sub-pixel position survives
 * because we round the offset, not the box.
 */
export const snapToPixel = (value: number) => {
  const ratio = window.devicePixelRatio || 1;

  return Math.round(value * ratio) / ratio;
};
