import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  hide,
  offset,
  shift,
  size,
  type Boundary,
  type Middleware,
  type Rect,
  type ReferenceElement,
} from '@floating-ui/dom';
import {
  fromPlacement,
  toPlacement,
  type FloatingAlignment,
  type FloatingPoint,
  type FloatingSide,
  type TetherAnchoring,
  type TetherPlacement,
} from './placement';

/**
 * The tether: the progressive-enhancement half of the floating
 * primitive. The pure-CSS placement gets the surface onto the right
 * side of the anchor with no JavaScript at all; the tether watches the
 * boxes involved and, once it can measure them, hands back a resolved
 * placement that dodges whatever is clipping the surface.
 *
 * All of the geometry is `@floating-ui/dom`'s — flipping, sliding,
 * arrow centering, and available-space measurement. This module owns
 * only the reactive shell: build the middleware list from declarative
 * options, keep it fed by `autoUpdate`, and flatten the result into a
 * record of values the container can hand to CSS. It never touches the
 * DOM beyond measuring, so the container stays the single writer.
 *
 * Coordinates come back relative to the surface's offset parent — the
 * anchor, since the shell is absolutely positioned inside it. That is
 * exactly the space the CSS placement already works in, so the tether's
 * output slots straight into a `translate` without a second frame of
 * reference.
 */

/** One fallback placement `flip` may fall back to, in preference order. */
export interface TetherFallback {
  /** Edge of the anchor the fallback binds to. */
  side: FloatingSide;
  /** Alignment along that edge. Defaults to the requested alignment. */
  align?: FloatingAlignment;
}

/** Consumer-facing tuning knobs for a tethered container. */
export interface TetherOptions {
  /**
   * Clearance to keep between the surface and the clipping boundary,
   * in px. Defaults to `0`.
   */
  padding?: number;
  /**
   * Flip to another side when the requested one overflows. Defaults to
   * `true`.
   */
  flip?: boolean;
  /**
   * Ordered placements to try when the requested one doesn't fit.
   * Defaults to the opposite side, then the opposite alignment.
   */
  fallbacks?: readonly TetherFallback[];
  /**
   * Slide the surface along the bound edge to keep it in view.
   * Defaults to `true`.
   */
  shift?: boolean;
  /**
   * Measure the room left for the surface inside the boundary and
   * publish it (see {@link TetherDecisions.availableWidth}). Defaults
   * to `true`.
   */
  size?: boolean;
  /**
   * Flag the surface once the anchor has been scrolled out of its
   * clipping ancestor, so it can hide instead of pointing at nothing.
   * Costs an extra overflow pass. Defaults to `false`.
   */
  hideWhenDetached?: boolean;
  /**
   * The element(s) that clip the surface. Defaults to the scroll
   * ancestry, bounded by the viewport.
   */
  boundary?: Element | readonly Element[];
}

/** Everything a tether run needs; `null` disables the tether. */
export interface TetherConfig extends TetherOptions {
  /** The floating container element (the positioning shell). */
  popup: HTMLElement;
  /** The anchor element the placement resolves against. */
  anchor: HTMLElement;
  /** Requested placement before any collision handling. */
  placement: TetherPlacement;
  /**
   * Bind to a coordinate inside the anchor instead of its edge. The
   * point becomes a zero-size virtual anchor, so every side, alignment,
   * and offset keeps its edge-mode meaning.
   */
  point?: FloatingPoint;
  /** The arrow element, when one is rendered. */
  arrow?: SVGSVGElement;
  /**
   * Clearance to keep between the arrow and the surface's corners, in
   * px — normally the surface's border radius.
   */
  arrowPadding?: number;
}

/**
 * A resolved placement. Every field maps onto one of the container's
 * override channels: a data attribute or a CSS var slot.
 */
export interface TetherDecisions {
  /** Resolved edge after collision handling. */
  side: FloatingSide;
  /** Resolved alignment after collision handling. */
  align: FloatingAlignment;
  /** Surface offset from the anchor's padding box, in px. */
  x: number;
  y: number;
  /**
   * Arrow offset from the surface's leading edge along the edge it sits
   * on, in px. `null` when no arrow is being positioned.
   */
  arrowOffset: number | null;
  /** Whether the arrow can no longer reach the anchor's center. */
  arrowHidden: boolean;
  /** `transform-origin` aimed back at the anchor, for scale animations. */
  transformOrigin: string;
  /** Room the surface has inside the boundary, in px. */
  availableWidth: number | null;
  availableHeight: number | null;
  /** The anchor's measured box, for size matching. */
  anchorWidth: number;
  anchorHeight: number;
  /** Whether the anchor has been clipped out of view. */
  anchorHidden: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Snap to the device pixel grid. Sub-pixel translations blur text on
 * the surface; the anchor's own sub-pixel position is preserved because
 * we round the offset, not the box.
 */
const snapToPixel = (value: number) => {
  const ratio = window.devicePixelRatio || 1;
  return Math.round(value * ratio) / ratio;
};

/**
 * Aim the scale origin at the anchor's center, clamped to the surface
 * so an off-center anchor still grows from the nearest edge point.
 */
const originFacing = (
  side: FloatingSide,
  coords: { x: number; y: number },
  rects: { reference: Rect; floating: Rect },
): string => {
  const { reference, floating } = rects;
  const across = snapToPixel(
    clamp(reference.x + reference.width / 2 - coords.x, 0, floating.width),
  );
  const down = snapToPixel(
    clamp(reference.y + reference.height / 2 - coords.y, 0, floating.height),
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
 * A zero-size anchor pinned to a point inside the real one. Sizing it
 * to nothing is what keeps the point-mode semantics identical to edge
 * mode: `start` puts the surface's leading edge on the point, `end` its
 * trailing edge, `center` straddles it.
 */
const pointReference = (
  anchor: HTMLElement,
  point: FloatingPoint,
): ReferenceElement => ({
  contextElement: anchor,
  getBoundingClientRect: () => {
    const box = anchor.getBoundingClientRect();
    const left = box.left + point.x;
    const top = box.top + point.y;

    return {
      x: left,
      y: top,
      width: 0,
      height: 0,
      top,
      left,
      right: left,
      bottom: top,
    };
  },
});

/** Capture the measured boxes; the position result doesn't carry them. */
const captureRects = (): Middleware => ({
  name: 'rects',
  fn: ({ rects }) => ({ data: rects }),
});

/**
 * Translate the declarative options into a middleware list. Order is
 * the one `@floating-ui/dom` prescribes: displace, then choose a side,
 * then slide, then measure, then seat the arrow, then test visibility.
 */
const buildMiddleware = (
  config: TetherConfig,
  onSize: (available: { width: number; height: number }) => void,
): Middleware[] => {
  const { placement } = config;
  const padding = config.padding ?? 0;
  const boundary = config.boundary as Boundary | undefined;
  const detection = { padding, ...(boundary && { boundary }) };

  return [
    offset({
      mainAxis: placement.sideOffset,
      // `alignmentAxis` wins for aligned placements and inverts at
      // `end`, which is the sign convention the CSS placement uses;
      // `crossAxis` covers the centered case it skips.
      crossAxis: placement.alignOffset,
      alignmentAxis: placement.alignOffset,
    }),
    ...(config.flip === false
      ? []
      : [
          flip({
            ...detection,
            ...(config.fallbacks && {
              fallbackPlacements: config.fallbacks.map((fallback) =>
                toPlacement({
                  side: fallback.side,
                  align: fallback.align ?? placement.align,
                }),
              ),
            }),
          }),
        ]),
    ...(config.shift === false ? [] : [shift(detection)]),
    ...(config.size === false
      ? []
      : [
          size({
            ...detection,
            apply: ({ availableWidth, availableHeight }) =>
              onSize({ width: availableWidth, height: availableHeight }),
          }),
        ]),
    ...(config.arrow
      ? [arrow({ element: config.arrow, padding: config.arrowPadding ?? 0 })]
      : []),
    ...(config.hideWhenDetached ? [hide(detection)] : []),
    captureRects(),
  ];
};

/** Run one placement pass and flatten it into decisions. */
const resolve = async (config: TetherConfig): Promise<TetherDecisions> => {
  // Held in a record, not a local: `size`'s `apply` writes it from a
  // callback, and a plain `let` would narrow back to `null` at the read.
  const measured: { available: { width: number; height: number } | null } = {
    available: null,
  };

  const reference = config.point
    ? pointReference(config.anchor, config.point)
    : config.anchor;

  const { x, y, placement, middlewareData } = await computePosition(
    reference,
    config.popup,
    {
      strategy: 'absolute',
      placement: toPlacement(config.placement),
      middleware: buildMiddleware(config, (available) => {
        measured.available = available;
      }),
    },
  );

  const anchoring: TetherAnchoring = fromPlacement(placement);
  const rects = middlewareData.rects as { reference: Rect; floating: Rect };
  const arrowData = middlewareData.arrow;
  const arrowOffset = arrowData?.x ?? arrowData?.y ?? null;

  return {
    ...anchoring,
    x: snapToPixel(x),
    y: snapToPixel(y),
    arrowOffset: arrowOffset === null ? null : snapToPixel(arrowOffset),
    arrowHidden: (arrowData?.centerOffset ?? 0) !== 0,
    transformOrigin: originFacing(anchoring.side, { x, y }, rects),
    availableWidth: measured.available?.width ?? null,
    availableHeight: measured.available?.height ?? null,
    anchorWidth: rects.reference.width,
    anchorHeight: rects.reference.height,
    anchorHidden: middlewareData.hide?.referenceHidden ?? false,
  };
};

/**
 * Value equality for the decisions signal. Every run builds a fresh
 * record, so subscriber stability has to come from comparing values.
 */
const sameDecisions = (
  before: TetherDecisions | null,
  after: TetherDecisions | null,
): boolean =>
  before === after ||
  (before !== null &&
    after !== null &&
    (Object.keys(after) as (keyof TetherDecisions)[]).every(
      (key) => before[key] === after[key],
    ));

/**
 * Watch a floating container and stream resolved placements for it.
 * Every element involved rides in through the config — the tether never
 * queries the DOM for structure.
 *
 * Returns `null` until a run completes, and forever in environments
 * without the observers `autoUpdate` needs (jsdom, pre-hydration).
 * `null` means "the pure-CSS placement stands", which is the whole
 * progressive-enhancement contract.
 */
export const createTether = (
  config: Accessor<TetherConfig | null>,
): Accessor<TetherDecisions | null> => {
  const [decisions, setDecisions] = createSignal<TetherDecisions | null>(null, {
    equals: sameDecisions,
  });

  createEffect(() => {
    const current = config();

    if (
      !current ||
      typeof ResizeObserver === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setDecisions(null);
      return;
    }

    // Placement is async, so a run can land after the config it was
    // measured for is gone. Stale results are dropped, not applied.
    let live = true;

    const update = () => {
      void resolve(current).then((next) => {
        if (live) setDecisions(next);
      });
    };

    const stop = autoUpdate(
      current.point
        ? pointReference(current.anchor, current.point)
        : current.anchor,
      current.popup,
      update,
    );

    onCleanup(() => {
      live = false;
      stop();
      setDecisions(null);
    });
  });

  return decisions;
};
