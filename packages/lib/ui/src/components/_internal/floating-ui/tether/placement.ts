import type { Placement } from '@floating-ui/dom';

/**
 * The primitive's placement vocabulary and its translation to and from
 * `@floating-ui/dom`'s `Placement` strings.
 *
 * We keep a `side`/`align` pair rather than adopting the library's
 * hyphenated strings because both the pure-CSS placement and the
 * eventual `position-area` migration are keyed off the pair — `side`
 * maps to `data-side`, `align` to `data-align`.
 */

/** Which edge of the anchor a floating surface binds to. */
export type FloatingSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Placement of the surface along the anchor edge it binds to. `start`
 * hugs the top (left/right sides) or left (top/bottom sides); `end` the
 * opposite; `center` splits the difference.
 */
export type FloatingAlignment = 'start' | 'center' | 'end';

/**
 * A coordinate inside the anchor box, in px from its top-left corner.
 * Binds the surface to a point instead of an edge — context menus
 * anchor to the pointer, item-aligned selects to a measured item.
 */
export interface FloatingPoint {
  /** Horizontal distance from the anchor's left edge, in px. */
  x: number;
  /** Vertical distance from the anchor's top edge, in px. */
  y: number;
}

/** A side/align pair — the primitive's placement, minus the offsets. */
export interface TetherAnchoring {
  /** Edge of the anchor the surface binds to. */
  side: FloatingSide;
  /** Placement along that edge. */
  align: FloatingAlignment;
}

/** The requested placement, before any collision handling. */
export interface TetherPlacement extends TetherAnchoring {
  /** Gap between the anchor edge (or point) and the surface, in px. */
  sideOffset: number;
  /** Nudge along the bound edge, in px. */
  alignOffset: number;
}

/** Our side/align pair as a floating-ui placement string. */
export const toPlacement = ({ side, align }: TetherAnchoring): Placement =>
  align === 'center' ? side : `${side}-${align}`;

/** A floating-ui placement string back as a side/align pair. */
export const fromPlacement = (placement: Placement): TetherAnchoring => {
  const [side, align] = placement.split('-') as [
    FloatingSide,
    Exclude<FloatingAlignment, 'center'>?,
  ];

  return { side, align: align ?? 'center' };
};
