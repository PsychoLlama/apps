import type { FloatingAlignment, FloatingSide } from '../floating-ui';

/**
 * Pure placement math for the tether. Everything here predicts where
 * the CSS placement rules will put a surface from sizes alone — the
 * pipeline never has to measure an element after moving it, so there
 * are no observe/apply feedback loops.
 */

/** Axis-aligned box in viewport coordinates. */
export interface TetherRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The rect's far edge on the x axis. */
export const rightOf = (rect: TetherRect): number => rect.x + rect.width;

/** The rect's far edge on the y axis. */
export const bottomOf = (rect: TetherRect): number => rect.y + rect.height;

/** The rect's midpoint on the x axis. */
export const centerX = (rect: TetherRect): number => rect.x + rect.width / 2;

/** The rect's midpoint on the y axis. */
export const centerY = (rect: TetherRect): number => rect.y + rect.height / 2;

/** Clamp `value` into `[min, max]`, tolerating an inverted range. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

/** Whether the side binds above/below (its cross axis runs on x). */
export const isVerticalSide = (side: FloatingSide): boolean =>
  side === 'top' || side === 'bottom';

/** The opposite edge, the usual position-try fallback. */
export const OPPOSITE_SIDE: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Shrink a rect inward by the same amount on every edge. */
export const inset = (rect: TetherRect, amount: number): TetherRect => ({
  x: rect.x + amount,
  y: rect.y + amount,
  width: Math.max(0, rect.width - amount * 2),
  height: Math.max(0, rect.height - amount * 2),
});

/** Whether `rect` lies fully inside `bounds`. */
export const contains = (bounds: TetherRect, rect: TetherRect): boolean =>
  rect.x >= bounds.x &&
  rect.y >= bounds.y &&
  rightOf(rect) <= rightOf(bounds) &&
  bottomOf(rect) <= bottomOf(bounds);

/** Area of the overlap between two rects, in px². */
export const overlapArea = (first: TetherRect, second: TetherRect): number => {
  const width =
    Math.min(rightOf(first), rightOf(second)) - Math.max(first.x, second.x);
  const height =
    Math.min(bottomOf(first), bottomOf(second)) - Math.max(first.y, second.y);
  return Math.max(0, width) * Math.max(0, height);
};

/** Placement inputs the CSS rules resolve — mirrored for prediction. */
export interface TetherPlacement {
  side: FloatingSide;
  align: FloatingAlignment;
  sideOffset: number;
  alignOffset: number;
}

/**
 * Predict the surface rect the CSS placement rules produce for a
 * side/align, in viewport coordinates. Mirrors the container's edge
 * mode exactly: fully outside the bound edge, gapped by `sideOffset`,
 * aligned along the edge with `alignOffset` under Radix's logical
 * inversion (positive never flips meaning when alignment flips).
 */
export const place = (
  anchor: TetherRect,
  size: { width: number; height: number },
  placement: TetherPlacement,
): TetherRect => {
  const { side, align, sideOffset, alignOffset } = placement;

  const main =
    side === 'top'
      ? anchor.y - sideOffset - size.height
      : side === 'bottom'
        ? bottomOf(anchor) + sideOffset
        : side === 'left'
          ? anchor.x - sideOffset - size.width
          : rightOf(anchor) + sideOffset;

  const crossStart = isVerticalSide(side) ? anchor.x : anchor.y;
  const crossAnchorSize = isVerticalSide(side) ? anchor.width : anchor.height;
  const crossSize = isVerticalSide(side) ? size.width : size.height;

  const cross =
    align === 'start'
      ? crossStart + alignOffset
      : align === 'center'
        ? crossStart + crossAnchorSize / 2 - crossSize / 2 + alignOffset
        : crossStart + crossAnchorSize - crossSize - alignOffset;

  return isVerticalSide(side)
    ? { x: cross, y: main, width: size.width, height: size.height }
    : { x: main, y: cross, width: size.width, height: size.height };
};

/**
 * Room between the anchor and the viewport edge on the given side,
 * after the gap and edge padding are spent. This is the space a
 * surface bound to that side may occupy.
 */
export const availableOnSide = (
  anchor: TetherRect,
  viewport: TetherRect,
  side: FloatingSide,
  sideOffset: number,
  padding: number,
): number => {
  switch (side) {
    case 'top':
      return anchor.y - viewport.y - sideOffset - padding;
    case 'bottom':
      return bottomOf(viewport) - bottomOf(anchor) - sideOffset - padding;
    case 'left':
      return anchor.x - viewport.x - sideOffset - padding;
    case 'right':
      return rightOf(viewport) - rightOf(anchor) - sideOffset - padding;
  }
};
