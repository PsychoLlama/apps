import {
  arrow,
  flip,
  offset,
  shift,
  size,
  type Boundary,
  type ComputePositionConfig,
  type DetectOverflowOptions,
  type Dimensions,
  type FlipOptions,
  type Middleware,
  type MiddlewareData,
  type Padding,
  type Rect,
  type ShiftOptions,
  type SizeOptions,
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

/**
 * `flip`, with the fallback chain in the primitive's own vocabulary.
 * Every other knob the middleware takes passes straight through.
 */
export interface TetherFlipOptions extends Omit<
  FlipOptions,
  'fallbackPlacements'
> {
  /**
   * Placements to try, in order, when the requested one overflows — the
   * same model as CSS `position-try-fallbacks`. Defaults to the
   * opposite side.
   */
  fallbacks?: readonly TetherFallback[];
}

/**
 * One collision pass: its middleware's options, or a plain `true`/
 * `false` to take the defaults or skip the pass entirely.
 */
export type TetherPass<Options> = Options | boolean;

/**
 * Consumer-facing tuning knobs, one entry per middleware the tether
 * runs. Each pass is on by default and can be turned off with `false`
 * or tuned by handing it the middleware's own options.
 */
export interface TetherOptions {
  /**
   * Clearance to keep between the floating element and the clipping
   * boundary, in px. A default for every pass below. Defaults to `0`.
   */
  padding?: Padding;
  /**
   * The element(s) that clip the floating element. A default for every
   * pass below. Defaults to the scroll ancestry, bounded by the
   * viewport.
   */
  boundary?: Boundary;
  /**
   * Move to another placement when the requested one overflows.
   * `false` pins the placement.
   */
  flip?: TetherPass<TetherFlipOptions>;
  /** Slide along the bound edge to stay in view. */
  shift?: TetherPass<ShiftOptions>;
  /**
   * Measure the room left inside the boundary and publish it (see
   * `TetherState.available`).
   */
  size?: TetherPass<Omit<SizeOptions, 'apply'>>;
}

/** Everything one placement pass needs; `null` disables the tether. */
export interface TetherConfig extends TetherOptions {
  /** The anchor element the placement resolves against. */
  anchor: HTMLElement;
  /** The floating element being placed — the positioned window. */
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
 * `size`'s measurement, published as middleware data.
 *
 * The library's only output channel for it is the `apply` callback,
 * shaped for mutating the floating element's styles directly. The
 * tether never writes to the DOM — it publishes `--available-width` and
 * `--available-height` and lets the surface decide what to do with the
 * room (cap its height and scroll, cap its width, ignore it entirely).
 * So the callback is rewrapped as data, like every other middleware.
 */
const availableSpace = (options: Omit<SizeOptions, 'apply'>): Middleware => {
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
 * Resolve one pass's options: `false` skips it, `true` or an absent
 * entry takes the shared overflow defaults, and an options object is
 * layered over them.
 */
const pass = <Options extends DetectOverflowOptions>(
  option: TetherPass<Options> | undefined,
  defaults: DetectOverflowOptions,
): Options | null => {
  if (option === false) return null;
  if (option === true || option === undefined) return defaults as Options;

  return { ...defaults, ...option };
};

/**
 * Translate the options map into a middleware list, in the order
 * `@floating-ui/dom` prescribes: displace, choose a placement, slide,
 * measure the room, seat the arrow. Our own reporting middleware run
 * last, where the numbers are final.
 *
 * Disabled passes are left in place as `false`; the library skips them,
 * which keeps the list read as the pipeline in source order.
 */
export const buildMiddleware = (
  config: TetherConfig,
): ComputePositionConfig['middleware'] => {
  const overflow: DetectOverflowOptions = {
    padding: config.padding ?? 0,
    ...(config.boundary && { boundary: config.boundary }),
  };

  const flipPass = pass(config.flip, overflow);
  const shiftPass = pass(config.shift, overflow);
  const sizePass = pass(config.size, overflow);

  // `position-try-fallbacks` in our own vocabulary: a side/align pair
  // per entry, with the alignment inherited from the request.
  const { fallbacks, ...flipOptions } = flipPass ?? {};
  const fallbackPlacements = fallbacks?.map(({ side, align }) =>
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
    flipPass &&
      flip({
        ...flipOptions,
        ...(fallbackPlacements && { fallbackPlacements }),
      }),
    shiftPass && shift(shiftPass),
    sizePass && availableSpace(sizePass),
    config.arrow &&
      arrow({ element: config.arrow, padding: config.arrowPadding ?? 0 }),
    anchorSize(),
    transformOrigin(),
  ];
};
