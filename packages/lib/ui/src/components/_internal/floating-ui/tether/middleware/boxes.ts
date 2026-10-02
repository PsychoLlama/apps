import { assert } from '@lib/assert';
import {
  type ComputePositionReturn,
  type Middleware,
  type MiddlewareData,
  type MiddlewareState,
  type Rect,
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
 * Each box comes in both of the spaces the tether deals in, because
 * neither one can be worked out from the other downstream. The
 * measurement's own coordinates are the offset parent's, which is what
 * placement needs; a component comparing a box against a pointer needs
 * the viewport's, and the conversion between them belongs to the
 * platform.
 *
 * Reporting only, in the style of our `arrow`: it never moves the window
 * and never resets, so it's safe to run last and see the position
 * everything else settled on.
 */

/**
 * A measured box, in both of the spaces the tether deals in.
 *
 * `x`/`y` are the offset parent's — the space the measurement's own
 * `x`/`y` live in, and the one every middleware does its arithmetic in.
 * `clientX`/`clientY` are the viewport's, the space pointer events and
 * `getBoundingClientRect` speak. Boxes subtract within a space and never
 * across one: mixing the two silently assumes the page isn't scaled.
 *
 * `width`/`height` are the measured size, which is the offset parent's;
 * under a scaled ancestor the box's size on screen differs by that
 * scale.
 */
export interface FloatingBox {
  /** Distance from the offset parent's left edge, in px. */
  x: number;

  /** Distance from the offset parent's top edge, in px. */
  y: number;

  /** Distance from the viewport's left edge, in px. */
  clientX: number;

  /** Distance from the viewport's top edge, in px. */
  clientY: number;

  /** Width, in px. */
  width: number;

  /** Height, in px. */
  height: number;
}

/**
 * What the middleware reports, under `middlewareData.boxes`.
 *
 * The two boxes are in the same spaces as each other, so they subtract:
 * the anchor's leading edge relative to the window's is
 * `anchor.x - subject.x` for a window on the `y` axis, and the same in
 * `y` for one on `x`. Where the pointer is along that edge is
 * `event.clientX - subject.clientX`.
 */
export interface FloatingBoxes {
  /** The anchor's box, as the placement was measured against it. */
  anchor: FloatingBox;

  /** The window's box, where this measurement puts it. */
  subject: FloatingBox;
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
 * Report the measured anchor and window boxes.
 *
 * Takes no options and makes no decisions. The window's middleware list
 * carries it for every tethered measurement, so a reader takes the report
 * off the measurement itself —
 * `useTetherState()?.measurement()?.middlewareData.boxes` — rather than
 * through anything that would have to restate the same guarantee.
 */
export const boxes = (): Middleware => ({
  name: 'boxes',
  async fn(state: MiddlewareState) {
    const { x, y, rects, elements, platform, strategy } = state;

    // Crossing into the viewport's space is the platform's to do, not
    // ours: it means accounting for the offset parent's scroll, its
    // borders, and any scale on the way down. These are the same two
    // calls `detectOverflow` makes, which is to say the ones `flip` and
    // `shift` already lean on.
    //
    // Core types them optional for the sake of platforms written by
    // hand. Every platform that measures a DOM has them, so a tether
    // without them is a broken build rather than a case to degrade for
    // — and degrading would mean reporting the offset parent's
    // coordinates as the viewport's, which is a wrong answer that looks
    // like a right one.
    assert(
      platform.convertOffsetParentRelativeRectToViewportRelativeRect &&
        platform.getOffsetParent,
      '[tether/boxes] Missing required platform APIs.',
    );

    // Typed `unknown` because the platform types it `any`: it's an
    // element, the window, or nothing, and only the platform that
    // produced it has to know which.
    const offsetParent: unknown = await platform.getOffsetParent(
      elements.floating,
    );

    // The window's box as this measurement leaves it. Not
    // `rects.floating`, which the DOM platform reports at the origin
    // because placing it is `computePosition`'s job — the position is
    // `x`/`y`, and this middleware runs last, so they're final.
    const subjectRect: Rect = {
      x,
      y,
      width: rects.floating.width,
      height: rects.floating.height,
    };

    const [anchorClient, subjectClient] = await Promise.all([
      platform.convertOffsetParentRelativeRectToViewportRelativeRect({
        elements,
        rect: rects.reference,
        offsetParent,
        strategy,
      }),
      platform.convertOffsetParentRelativeRectToViewportRelativeRect({
        elements,
        rect: subjectRect,
        offsetParent,
        strategy,
      }),
    ]);

    const data: FloatingBoxes = {
      anchor: {
        ...rects.reference,
        clientX: anchorClient.x,
        clientY: anchorClient.y,
      },
      subject: {
        ...subjectRect,
        clientX: subjectClient.x,
        clientY: subjectClient.y,
      },
    };

    return { data };
  },
});
