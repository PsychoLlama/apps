import {
  arrow,
  flip,
  hide,
  offset,
  shift,
  size,
  type Boundary,
  type DetectOverflowOptions,
  type Dimensions,
  type Middleware,
  type MiddlewareData,
  type Padding,
  type Rect,
} from '@floating-ui/dom';
import { clamp } from './pixels';
import {
  fromPlacement,
  toPlacement,
  type FloatingAlignment,
  type FloatingPlacement,
  type FloatingPoint,
  type FloatingSide,
} from './placement';

/**
 * The tether's floating-ui layer: the knobs a consumer turns, and the
 * middleware pipeline they translate into.
 *
 * Everything geometric is the library's — flipping, sliding, arrow
 * centering, available-space measurement. The three middleware defined
 * here only report measurements `computePosition` doesn't return on its
 * own, in the shape the library prescribes: a named middleware handing
 * back `data`.
 */

/**
 * One placement in a fallback chain. `align` defaults to the requested
 * alignment, so `{ side: 'top' }` means "same alignment, other edge".
 */
export interface TetherFallback {
  /** Edge of the anchor this fallback binds to. */
  side: FloatingSide;
  /** Alignment along that edge. Defaults to the requested alignment. */
  align?: FloatingAlignment;
}

/** Consumer-facing tuning knobs for a tethered floating element. */
export interface TetherOptions {
  /**
   * Clearance to keep between the floating element and the clipping
   * boundary, in px. Defaults to `0`.
   */
  padding?: Padding;
  /**
   * Placements to try, in order, when the requested one overflows —
   * the same model as CSS `position-try-fallbacks`. An empty list pins
   * the placement and disables flipping entirely. Defaults to the
   * opposite side.
   */
  fallbacks?: readonly TetherFallback[];
  /**
   * Slide the floating element along the bound edge to keep it in view.
   * Defaults to `true`.
   */
  shift?: boolean;
  /**
   * Measure the room left inside the boundary and publish it (see
   * `TetherState.available`). Defaults to `true`.
   */
  size?: boolean;
  /**
   * Flag the floating element once the anchor has been scrolled out of
   * its clipping ancestor, so it can hide instead of pointing at
   * nothing. Costs an extra overflow pass. Defaults to `false`.
   */
  hideWhenDetached?: boolean;
  /**
   * The element(s) that clip the floating element. Defaults to the
   * scroll ancestry, bounded by the viewport.
   */
  boundary?: Boundary;
}

/** Everything one placement pass needs; `null` disables the tether. */
export interface TetherConfig extends TetherOptions {
  /** The anchor element the placement resolves against. */
  anchor: HTMLElement;
  /** The floating element being placed — the positioning container. */
  floating: HTMLElement;
  /** The arrow element, when one is rendered. */
  arrow?: SVGSVGElement;
  /** Requested placement, before any collision handling. */
  placement: FloatingPlacement;
  /**
   * Bind to a coordinate inside the anchor instead of its edge. The
   * point becomes a zero-size virtual anchor, so every side, alignment,
   * and offset keeps its edge-mode meaning.
   */
  point?: FloatingPoint;
  /**
   * Gap between the anchor edge (or point) and the floating element, in
   * px. Defaults to `0`.
   */
  sideOffset?: number;
  /** Nudge along the bound edge, in px. Defaults to `0`. */
  alignOffset?: number;
  /**
   * Clearance to keep between the arrow and the floating element's
   * corners, in px — normally its border radius. Defaults to `0`.
   */
  arrowPadding?: number;
}

/** `middlewareData` with the entries our own middleware contribute. */
export interface TetherData extends MiddlewareData {
  /** From {@link anchorSize}. */
  anchorSize?: Dimensions;
  /** From {@link availableSpace}. */
  availableSpace?: Dimensions;
  /** From {@link transformOrigin}. */
  transformOrigin?: { origin: string };
}

/**
 * Aim the scale origin at the anchor's center, clamped to the floating
 * box so an off-center anchor still grows from the nearest edge point.
 */
const originFacing = (
  side: FloatingSide,
  coords: { x: number; y: number },
  rects: { reference: Rect; floating: Rect },
): string => {
  const { reference, floating } = rects;
  const across = clamp(
    reference.x + reference.width / 2 - coords.x,
    0,
    floating.width,
  );
  const down = clamp(
    reference.y + reference.height / 2 - coords.y,
    0,
    floating.height,
  );

  switch (side) {
    case 'top':
      return `${across}px 100%`;
    case 'bottom':
      return `${across}px 0px`;
    case 'left':
      return `100% ${down}px`;
    case 'right':
      return `0px ${down}px`;
  }
};

/**
 * The anchor's measured box. `computePosition` reports coordinates but
 * not the rects it measured them from, and size-matched surfaces (a
 * select's listbox tracking its trigger) need them.
 */
const anchorSize = (): Middleware => ({
  name: 'anchorSize',
  fn: ({ rects }) => ({
    data: { width: rects.reference.width, height: rects.reference.height },
  }),
});

/**
 * A `transform-origin` aimed back at the anchor, for scale animations.
 * Runs last in the pipeline so it sees the final coordinates.
 */
const transformOrigin = (): Middleware => ({
  name: 'transformOrigin',
  fn: ({ placement, rects, x, y }) => ({
    data: {
      origin: originFacing(fromPlacement(placement).side, { x, y }, rects),
    },
  }),
});

/**
 * `size`'s measurement, published as middleware data. The library
 * shapes it as a style mutation (`apply`) because that's what most
 * consumers want; we only ever hand the numbers to CSS vars and let the
 * consumer decide whether to clamp, so it's rewrapped as data.
 */
const availableSpace = (options: DetectOverflowOptions): Middleware => {
  const room: Dimensions = { width: 0, height: 0 };
  const measure = size({
    ...options,
    apply: ({ availableWidth, availableHeight }) => {
      room.width = availableWidth;
      room.height = availableHeight;
    },
  });

  return {
    name: 'availableSpace',
    async fn(state) {
      return { ...(await measure.fn(state)), data: { ...room } };
    },
  };
};

/**
 * Translate the declarative options into a middleware list, in the
 * order `@floating-ui/dom` prescribes: displace, choose a side, slide,
 * measure the room, seat the arrow, test visibility. Our own reporting
 * middleware run last, where the numbers are final.
 */
export const buildMiddleware = (config: TetherConfig): Middleware[] => {
  const overflow: DetectOverflowOptions = {
    padding: config.padding ?? 0,
    ...(config.boundary && { boundary: config.boundary }),
  };

  // `position-try-fallbacks` semantics: an explicit chain replaces the
  // library's computed default, and an empty one pins the placement.
  const fallbackPlacements = config.fallbacks?.map(({ side, align }) =>
    toPlacement({ side, align: align ?? config.placement.align }),
  );

  return [
    offset({
      mainAxis: config.sideOffset ?? 0,
      // `alignmentAxis` wins for aligned placements and inverts at
      // `end`, which is the sign convention the CSS placement uses;
      // `crossAxis` covers the centered case it skips.
      crossAxis: config.alignOffset ?? 0,
      alignmentAxis: config.alignOffset ?? 0,
    }),
    ...(fallbackPlacements?.length === 0
      ? []
      : [
          flip({
            ...overflow,
            ...(fallbackPlacements && { fallbackPlacements }),
          }),
        ]),
    ...(config.shift === false ? [] : [shift(overflow)]),
    ...(config.size === false ? [] : [availableSpace(overflow)]),
    ...(config.arrow
      ? [arrow({ element: config.arrow, padding: config.arrowPadding ?? 0 })]
      : []),
    ...(config.hideWhenDetached ? [hide(overflow)] : []),
    anchorSize(),
    transformOrigin(),
  ];
};
