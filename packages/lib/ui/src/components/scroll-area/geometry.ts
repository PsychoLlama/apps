/**
 * ScrollArea geometry helpers.
 *
 * Pure math used by the ScrollArea component to size the thumb and
 * map between viewport scroll positions and pointer/thumb offsets.
 * Lives outside the component so the math can be unit-tested without
 * rendering a viewport.
 *
 * Lifted verbatim from Radix UI's ScrollArea primitive — see
 * `getThumbRatio`, `getThumbSize`, `getScrollPositionFromPointer`,
 * and `getThumbOffsetFromScroll` in the upstream source.
 *
 * @see https://www.radix-ui.com/primitives/docs/components/scroll-area
 */

/** Per-axis layout metrics consumed by every helper in this module. */
export type Sizes = {
  /** Total scrollable extent of the content along the axis. */
  content: number;
  /** Visible extent of the viewport along the axis. */
  viewport: number;
  /** Scrollbar track metrics along the axis. */
  scrollbar: { size: number; paddingStart: number; paddingEnd: number };
};

/**
 * Minimum visible thumb size in pixels. Matches macOS's native
 * floor (and Radix's) so a long page still presents a grabbable
 * thumb.
 */
export const MIN_THUMB_SIZE = 18;

/** Constrain `value` to the inclusive `[min, max]` range. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Build a function that linearly maps an `input` interval onto an
 * `output` interval. Returns `output[0]` when either interval is
 * degenerate (zero-width) to avoid `NaN` propagation.
 */
export const linearScale =
  (input: readonly [number, number], output: readonly [number, number]) =>
  (value: number): number => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };

/**
 * Ratio of viewport extent to total content extent — i.e., the
 * fraction of the track the thumb should cover. Returns `0` for
 * `NaN`/infinite inputs (zero content) so callers can short-circuit
 * the no-overflow case.
 */
export const getThumbRatio = (viewport: number, content: number): number => {
  const ratio = viewport / content;
  return Number.isNaN(ratio) || !Number.isFinite(ratio) ? 0 : ratio;
};

/**
 * Computed thumb length along the scroll axis in pixels. Floored at
 * {@link MIN_THUMB_SIZE} so a long page still surfaces a grabbable
 * handle.
 */
export const getThumbSize = (sizes: Sizes): number => {
  const ratio = getThumbRatio(sizes.viewport, sizes.content);
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const thumb = (sizes.scrollbar.size - padding) * ratio;
  return Math.max(thumb, MIN_THUMB_SIZE);
};

/**
 * Map a pointer position along the scrollbar track to the viewport
 * scroll position it represents. `pointerOffset` carries the
 * grab-point within the thumb (in pixels) when the press lands on
 * the thumb itself, and `null` when the press lands on the bare
 * track — in which case the thumb centers under the cursor.
 */
export const getScrollPositionFromPointer = (
  pointerPos: number,
  pointerOffset: number | null,
  sizes: Sizes,
): number => {
  const thumbSize = getThumbSize(sizes);
  const thumbCenter = thumbSize / 2;
  // `null` distinguishes "no offset captured" (track click — center
  // the thumb on the cursor) from a captured `0` (cursor pressed on
  // the thumb's leading edge — preserve the alignment).
  const offset = pointerOffset ?? thumbCenter;
  const thumbOffsetFromEnd = thumbSize - offset;
  const minPointer = sizes.scrollbar.paddingStart + offset;
  const maxPointer =
    sizes.scrollbar.size - sizes.scrollbar.paddingEnd - thumbOffsetFromEnd;
  const maxScroll = sizes.content - sizes.viewport;
  return linearScale([minPointer, maxPointer], [0, maxScroll])(pointerPos);
};

/**
 * Inverse of {@link getScrollPositionFromPointer}: map a viewport
 * scroll position to the thumb's translation along the track.
 * Clamps the input to `[0, maxScroll]` so over-scroll bounces
 * (rubber-banding) don't push the thumb past the track ends.
 */
export const getThumbOffsetFromScroll = (
  scrollPos: number,
  sizes: Sizes,
): number => {
  const thumbSize = getThumbSize(sizes);
  const padding = sizes.scrollbar.paddingStart + sizes.scrollbar.paddingEnd;
  const trackSize = sizes.scrollbar.size - padding;
  const maxScroll = sizes.content - sizes.viewport;
  const maxThumb = trackSize - thumbSize;
  const clamped = clamp(scrollPos, 0, Math.max(maxScroll, 0));
  return linearScale([0, maxScroll], [0, maxThumb])(clamped);
};
