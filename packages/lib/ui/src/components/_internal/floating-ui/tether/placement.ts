import type { Alignment, Placement, Side } from '@floating-ui/dom';

/**
 * The primitive's placement vocabulary and its translation to and from
 * `@floating-ui/dom`'s hyphenated `Placement` strings.
 *
 * The sides and alignments are the library's own — only the shape
 * differs. We keep them as a `side`/`align` pair because both the
 * pure-CSS placement and the eventual `position-area` migration are
 * keyed off the pair: `side` maps to `data-side`, `align` to
 * `data-align`.
 */

/** Which edge of the anchor a floating element binds to. */
export type FloatingSide = Side;

/**
 * Placement of the floating element along the anchor edge it binds to.
 * `start` hugs the top (left/right sides) or left (top/bottom sides);
 * `end` the opposite; `center` splits the difference — the library's
 * unaligned placement, spelled out so the pair is always complete.
 */
export type FloatingAlignment = Alignment | 'center';

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

/** Our side/align pair as a floating-ui placement string. */
export const toPlacement = ({ side, align }: FloatingPlacement): Placement =>
  align === 'center' ? side : `${side}-${align}`;

/** A floating-ui placement string back as a side/align pair. */
export const fromPlacement = (placement: Placement): FloatingPlacement => {
  const [side, align] = placement.split('-') as [FloatingSide, Alignment?];

  return { side, align: align ?? 'center' };
};
