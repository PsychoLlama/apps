import {
  type ComputePositionReturn,
  type Middleware,
  type MiddlewareData,
  type MiddlewareState,
} from '@floating-ui/dom';

/**
 * Forwards the boxes floating-ui measured for a placement, so nothing
 * downstream has to measure the same elements a second time.
 *
 * Every measurement starts by sizing the anchor and the window, and
 * `computePosition` drops both on the way out — the result it returns
 * carries coordinates and middleware data, not the geometry they came
 * from. A component that needs the anchor's extent (a hit region
 * spanning it, a window sized to match it) would otherwise reach for
 * `getBoundingClientRect` and measure, off-schedule, what the tether
 * already has.
 *
 * Reporting only, in the style of our `arrow`: it never moves the window
 * and never resets, so it's safe to run last and see the position
 * everything else settled on.
 *
 * It reports the anchor in full and the window by size alone, because
 * size alone is what was measured: the DOM platform reports the window's
 * rect at the origin (`x: 0, y: 0`) and leaves placing it to
 * `computePosition`, so the window's position is the measurement's
 * `x`/`y` and nothing else. Forwarding those zeros as coordinates would
 * only invite somebody to trust them.
 */

/** A measured box, in the space described by {@link FloatingBoxes}. */
export type FloatingBox = Pick<DOMRect, 'x' | 'y' | 'width' | 'height'>;

/** A measured size, for a box whose position is reported elsewhere. */
export type FloatingSize = Pick<DOMRect, 'width' | 'height'>;

/**
 * What the middleware reports, under `middlewareData.boxes`.
 *
 * The anchor's coordinates are in the same space as the measurement's
 * own `x`/`y` — the window's offset parent, or the viewport under the
 * `fixed` strategy — so the two subtract. The anchor's leading edge
 * relative to the window's is `anchor.x - measurement.x` for a window on
 * the `y` axis, and the same in `y` for one on `x`.
 */
export interface FloatingBoxes {
  /** The anchor's box, as the placement was measured against it. */
  anchor: FloatingBox;

  /** The window's size. Its position is the measurement's `x`/`y`. */
  subject: FloatingSize;
}

/**
 * Upstream's middleware bag with this middleware's key named.
 *
 * `MiddlewareData` types the reports it ships with and leaves the rest
 * to an index signature, so a custom middleware's report comes back as
 * `any` — read straight off a measurement, `boxes` would be unchecked
 * and unsafe. Naming the key here is what makes reading it directly the
 * typed thing to do, and it belongs beside the middleware that writes
 * it. Optional because it is: inside the pipeline the report doesn't
 * exist until `boxes` runs, and it runs last.
 */
export interface FloatingMiddlewareData extends MiddlewareData {
  boxes?: FloatingBoxes;
}

/**
 * A measurement taken with the window's middleware list.
 *
 * What the tether publishes and what consumers read. Identical to
 * upstream's result apart from the bag, which carries our reports:
 * `measurement.middlewareData.boxes` for the boxes, and `.arrow` for the
 * seat, as it always did.
 */
export interface FloatingMeasurement extends Omit<
  ComputePositionReturn,
  'middlewareData'
> {
  middlewareData: FloatingMiddlewareData;
}

/**
 * Report the measured anchor box and window size.
 *
 * Takes no options and makes no decisions. The window's middleware list
 * carries it for every tethered measurement, so a reader takes the report
 * off the measurement itself —
 * `useTetherState()?.measurement()?.middlewareData.boxes` — rather than
 * through anything that would have to restate the same guarantee.
 */
export const boxes = (): Middleware => ({
  name: 'boxes',
  fn({ rects }: MiddlewareState) {
    const { width, height } = rects.floating;
    const data: FloatingBoxes = {
      anchor: rects.reference,
      subject: { width, height },
    };

    return { data };
  },
});
