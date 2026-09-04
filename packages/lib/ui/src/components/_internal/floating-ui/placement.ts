/**
 * The primitive's placement vocabulary.
 *
 * A placement is a `side`/`align` pair rather than a single string
 * because both the pure-CSS placement and the eventual
 * `position-area` migration are keyed off the pair: `side` maps to
 * `data-side`, `align` to `data-align`.
 */

/** Which edge of the anchor a floating element binds to. */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Placement of the floating element along the anchor edge it binds to.
 * `start` hugs the top (left/right sides) or left (top/bottom sides);
 * `end` the opposite; `center` splits the difference.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/**
 * A coordinate inside the anchor box, in px from its top-left corner.
 * Binds the floating element to a point instead of an edge — context
 * menus anchor to the pointer, item-aligned selects to a measured item.
 */
export interface FloatingPoint {
  /** Horizontal distance from the anchor's left edge, in px. */
  x: number;
  /** Vertical distance from the anchor's top edge, in px. */
  y: number;
}

/** A side/align pair — one placement in the primitive's vocabulary. */
export interface FloatingPlacement {
  /** Edge of the anchor the floating element binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
}
