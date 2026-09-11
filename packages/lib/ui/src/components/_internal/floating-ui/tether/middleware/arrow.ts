import {
  type arrow as upstream,
  type MiddlewareData,
  type MiddlewareState,
  type Padding,
} from '@floating-ui/dom';
import { type FloatingAlignment } from '../../types';
import { fromPlacement } from '../placement';

/**
 * Seats the arrow along the anchor edge. A drop-in for floating-ui's
 * `arrow` middleware: same name, same options, same report, different
 * rule.
 *
 * Upstream's rule (and Radix's) centers the arrow on the anchor, always.
 * The CSS placement seats it at the alignment corner instead, so the two
 * agree only for `center`, and a start/end-aligned arrow would snap on
 * hydration whenever the subject and anchor widths differ. This
 * middleware keeps the CSS seat and moves only when it has to, so given
 * room the modes agree for every alignment and nothing moves when the
 * tether wakes up.
 *
 * Deviations from Radix, both deliberate: after a `shift` the arrow
 * points at the nearest edge of the anchor rather than its center, and
 * in start/end alignment it sits at the corner rather than over the
 * anchor's center.
 *
 * Sharing upstream's name is the point, not a hazard: the window reads
 * `middlewareData.arrow` either way, and a consumer list that smuggles
 * in the built-in would collide rather than run both.
 */

/** What the middleware reports, under `middlewareData.arrow`. */
type ArrowData = NonNullable<MiddlewareData['arrow']>;

/**
 * Where the CSS placement seats the arrow for each alignment: its leading
 * edge's offset from the subject's, given both lengths along the edge and
 * the padding at each end.
 */
const SEAT_BY_ALIGN: Record<
  FloatingAlignment,
  (subject: number, arrow: number, padding: Range) => number
> = {
  start: (_subject, _arrow, padding) => padding.min,
  center: (subject, arrow) => (subject - arrow) / 2,
  end: (subject, arrow, padding) => subject - padding.max - arrow,
};

/** Padding at each end of the edge the arrow travels along. */
interface Range {
  min: number;
  max: number;
}

/** Resolve upstream's `Padding` to the two ends of the given axis. */
const paddingAlong = (padding: Padding, axis: 'x' | 'y'): Range => {
  if (typeof padding === 'number') return { min: padding, max: padding };

  return axis === 'x'
    ? { min: padding.left ?? 0, max: padding.right ?? 0 }
    : { min: padding.top ?? 0, max: padding.bottom ?? 0 };
};

const clamp = (min: number, value: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Seat the arrow at its alignment corner and slide it along the edge only
 * as far as the anchor demands.
 *
 * The arrow starts where the CSS puts it — at the corner for start/end,
 * centered for center, always `padding` in from the subject's ends. If
 * that seat leaves any of the arrow's base off the anchor, the arrow
 * slides to the nearest point where the whole base is over it.
 *
 * Reports `x` or `y` — the arrow's leading-edge offset from the
 * subject's, on the axis the alignment runs on — and `centerOffset`, which
 * is `0` whenever the arrow is seated over the anchor. When no seat over
 * the anchor exists inside the padding, the report keeps the alignment
 * seat and `centerOffset` is the shortfall: how far the anchor's span
 * falls short of holding the arrow's base. Nonzero means hide, as it
 * does for the upstream report.
 *
 * Never moves the subject and never resets; upstream nudges the subject
 * and re-runs when a small anchor leaves the arrow pointing at nothing.
 * Runs after the consumer's constraints, so it sees the position they
 * settled on.
 */
export const arrow: typeof upstream = (options) => ({
  name: 'arrow',
  options,
  async fn(state: MiddlewareState) {
    const { placement, rects, platform } = state;
    const { element, padding = 0 } =
      typeof options === 'function' ? options(state) : options;
    const { side, align } = fromPlacement(placement);

    // The arrow travels along the axis the alignment runs on — the one
    // the side doesn't own.
    const axis = side === 'top' || side === 'bottom' ? 'x' : 'y';
    const length = axis === 'x' ? 'width' : 'height';

    const arrowLength = (await platform.getDimensions(element))[length];
    const subjectLength = rects.floating[length];
    const pad = paddingAlong(padding, axis);

    // Where the arrow's leading edge may sit inside the subject at all.
    const subjectMin = pad.min;
    const subjectMax = subjectLength - pad.max - arrowLength;

    // The anchor's span along the edge, in the subject's own coordinates.
    const anchorStart = rects.reference[axis] - state[axis];
    const anchorEnd = anchorStart + rects.reference[length];

    // Where the whole base is over the anchor and inside the padding.
    //
    // Known wrong for small anchors. Demanding the whole base hides the
    // arrow for any anchor narrower than base + padding — a small icon
    // button, and every point reference, which is 0×0 — even though the
    // arrow's tip is a single pixel and could plausibly point at them.
    // Anchor size alone isn't grounds for hiding; what should matter is
    // whether any seat still overlaps the anchor, which stops being true
    // only once it has slid clear of the subject (a point scrolled to the
    // boundary, or off screen).
    const min = Math.max(subjectMin, anchorStart);
    const max = Math.min(subjectMax, anchorEnd - arrowLength);

    const seat = SEAT_BY_ALIGN[align](subjectLength, arrowLength, pad);
    const shortfall = Math.max(0, min - max);
    const data: ArrowData = {
      centerOffset: shortfall,
      [axis]: shortfall
        ? clamp(subjectMin, seat, subjectMax)
        : clamp(min, seat, max),
    };

    return { data };
  },
});
