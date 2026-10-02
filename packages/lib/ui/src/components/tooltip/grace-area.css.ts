/**
 * The grace area: the strip of page between a floating window and the
 * trigger it opened off, made real so the pointer can cross from one to
 * the other without leaving the root on the way.
 *
 * Worn by the window as a pseudo-element of it — resting on the strip is
 * hovering the window, it shows and hides with the window, and the
 * window's own `pointer-events: none` is all it has to take back. The
 * rules below read the window's placement attributes and its arrow's
 * vars, so the window is the only thing that can wear it.
 *
 * What it doesn't know is why it's there. Whether to draw it at all, how
 * long to hold it inert, where the pointer was last seen, and where the
 * trigger is are the consumer's to say; the vars exported here are the
 * whole of that conversation.
 */

import { createVar, keyframes, style } from '@vanilla-extract/css';
import * as floating from '../_internal/floating-ui/index.css';

/**
 * Whether there's a strip at all, as a `content` value: `""` draws one,
 * `none` leaves the pseudo-element ungenerated and everything here
 * inert.
 *
 * Declared by the consumer rather than defaulted here, and declared on
 * an ancestor of the window so the answer can come from wherever the
 * consumer keeps it. That's also what keeps a tooltip nested inside
 * another window honest: it declares its own, so it answers for itself
 * instead of inheriting its host's answer. Left undeclared, `content`
 * is invalid and no strip is drawn — the safe way round.
 */
export const enabled = createVar();

/**
 * How long the strip waits before it takes the pointer, measured from
 * the moment the consumer decides to open.
 *
 * It should cover the whole of the window's arrival. The strip rides
 * along on the window's `transform`, which on the way in drags it
 * across the trigger's edge, where a live strip would swallow the press
 * it's sitting on. Waiting costs nothing: the pointer is on the trigger
 * for the entire arrival — that's what opened it — and the strip is
 * only ever crossed on the way back out.
 */
export const armDelay = createVar();

/**
 * Where the pointer was last seen, as a length along the edge the strip
 * spans, measured from the window's start. The strip's end on that side
 * centers there, so it covers the crossing being made rather than the one
 * the arrow points at: under `data-path="enter"` that's the end on the
 * trigger, where the pointer is leaving from, and under
 * `data-path="leave"` the end on the window, for the same reason.
 *
 * The consumer's to assign, since only it hears the pointer, and only
 * for the end the pointer is standing on. Defaults to the middle of the
 * window, which is roughly where a centered arrow already was.
 */
export const cursor = createVar();

/**
 * How far inside the window's start the trigger begins, along the edge
 * the strip spans; negative where the trigger starts first. With
 * {@link anchorInsetEnd}, it's what the strip's end on the trigger
 * spans on the way back, and what the strip's box stretches over when
 * the trigger is the wider of the two.
 *
 * The consumer's to assign from a measurement. Defaults to `0px`, a
 * trigger flush with the window, which is the most the strip can claim
 * without one.
 */
export const anchorInsetStart = createVar();

/**
 * How far inside the window's end the trigger stops; negative where it
 * runs past it. The other half of {@link anchorInsetStart}.
 */
export const anchorInsetEnd = createVar();

// How far the strip reaches past the surface: across the arrow's row,
// then the gap the window opens off the trigger. Both are the window's,
// assigned from its props.
const REACH = `calc(${floating.arrowDepth} + ${floating.sideOffset})`;

// How far the trigger overhangs the window at either end, which is how
// far the strip's box has to stretch past the window's. A pointer can
// only hit the box, whatever the clip path draws, so a box the window's
// width would drop a pointer heading for the far corner of a wider
// trigger.
const overhangStart = `max(0px, -1 * ${anchorInsetStart})`;
const overhangEnd = `max(0px, -1 * ${anchorInsetEnd})`;

// The window's length along the edge, in the strip's own terms. Inside
// the clip path `100%` is the box, which is the window plus whatever
// the trigger overhangs it by.
const WINDOW = `(100% - ${overhangStart} - ${overhangEnd})`;

// The trigger's length along the same edge.
const ANCHOR = `(${WINDOW} - ${anchorInsetStart} - ${anchorInsetEnd})`;

// How wide the way back leaves the window: as wide as the trigger it's
// heading for, so there's a clear path onto it from anywhere along the
// window — no narrower than the arrow, for a trigger smaller than that,
// and no wider than the window, for one bigger.
const EXIT = `clamp(${floating.arrowBase}, ${ANCHOR}, ${WINDOW})`;

// The strip is a trapezoid: one end on the window, one on the anchor,
// and the four vars below say where each end begins and how far it
// runs. They're measured along the edge the strip spans, from the
// window's start, which leaves them free of which side the window
// landed on — that's the two edge vars' job, further down — and of how
// far the box stretches, which is the polygon's.
//
// All of them are declared and assigned on the window, where the
// placement and the arrow's seat are both known, and read by the strip.

/**
 * Where the end against the trigger begins. The end runs from here for
 * {@link anchorSpan}, so the taper comes down on the arrow wherever the
 * arrow was seated — or on the pointer, once {@link cursor} says where
 * the pointer is crossing.
 */
const anchorStart = createVar();

/**
 * How far that end runs. The arrow's base, unless the crossing is the
 * way back, where it's the whole trigger.
 */
const anchorSpan = createVar();

/**
 * Where the end against the surface begins. The window's start, unless
 * the crossing is the way back.
 */
const windowStart = createVar();

/**
 * How far that end runs. The window, edge to edge, unless the crossing
 * is the way back, where it's the trigger's width.
 */
const windowSpan = createVar();

// Each end's two corners, moved from the window's terms into the box's
// for the polygon below.
const inBox = (length: string) => `calc(${overhangStart} + ${length})`;
const anchorFrom = inBox(anchorStart);
const anchorTo = inBox(`${anchorStart} + ${anchorSpan}`);
const windowFrom = inBox(windowStart);
const windowTo = inBox(`${windowStart} + ${windowSpan}`);

/**
 * Which side of the strip each end sits on, as a percentage across the
 * strip's thickness. The whole of what the resolved side decides:
 * either the window is at the near edge and the trigger at the far one,
 * or the reverse.
 */
const anchorEdge = createVar();
const windowEdge = createVar();

/**
 * Holds the strip inert for {@link armDelay}. A zero-length animation
 * whose delay is the whole of the wait: the `backwards` fill wears the
 * opening frame until then, and when the animation ends the base rule's
 * `auto` takes over.
 *
 * Two stops rather than one because Vanilla Extract emits nothing for
 * an empty keyframes object, and an animation naming a missing
 * `@keyframes` never starts.
 */
const arm = keyframes({
  from: { pointerEvents: 'none' },
  to: { pointerEvents: 'none' },
});

/** The strip itself. Compose onto a floating window. */
export const graceArea = style({
  vars: {
    // A centered arrow, the seat the window defaults to. The leftover
    // space halved, rather than the middle less half a base, so it
    // reads as the arrow's leading corner like the alignment rules
    // below.
    [anchorStart]: `calc((${WINDOW} - ${floating.arrowBase}) / 2)`,
    [anchorSpan]: floating.arrowBase,

    // The middle of the window, for the strip of a tooltip no pointer
    // has turned up on — or one on a page with no script to hear it.
    [cursor]: `calc(${WINDOW} / 2)`,

    // A trigger flush with the window, until someone measures it.
    [anchorInsetStart]: '0px',
    [anchorInsetEnd]: '0px',

    // The window, edge to edge.
    [windowStart]: '0px',
    [windowSpan]: `calc(${WINDOW})`,

    // Every side assigns both; these are only here so the polygon has
    // something to resolve against if none does.
    [windowEdge]: '0%',
    [anchorEdge]: '100%',
  },

  selectors: {
    '&::before': {
      content: enabled,
      position: 'absolute',
      pointerEvents: 'auto',
      animation: `${arm} 0s ${armDelay} backwards`,
    },

    // The box and the shape, per axis. The box spans the window edge to
    // edge, plus however far the trigger overhangs either end, so
    // there's no seam to fall through; it's as thick as it reaches.
    // `data-axis` names the axis it reaches along, which is the one the
    // thickness lands on. Physical insets rather than logical ones,
    // since the overhangs are measured on the page.
    //
    // The shape is the same four points either way — an end on the
    // window, an end on the trigger — and the axis only decides which
    // coordinate each var lands in, which is why the two lists are
    // each other with the pairs swapped.
    '&:where([data-axis="y"])::before': {
      left: `calc(-1 * ${overhangStart})`,
      right: `calc(-1 * ${overhangEnd})`,
      height: REACH,
      clipPath: `polygon(${windowFrom} ${windowEdge}, ${windowTo} ${windowEdge}, ${anchorTo} ${anchorEdge}, ${anchorFrom} ${anchorEdge})`,
    },
    '&:where([data-axis="x"])::before': {
      top: `calc(-1 * ${overhangStart})`,
      bottom: `calc(-1 * ${overhangEnd})`,
      width: REACH,
      clipPath: `polygon(${windowEdge} ${windowFrom}, ${windowEdge} ${windowTo}, ${anchorEdge} ${anchorTo}, ${anchorEdge} ${anchorFrom})`,
    },

    // Where the arrow is seated along that edge, which is where the
    // taper has to come down. Untethered, `align-self` seats it and a
    // start/end arrow is nudged in by the surface's corner radius so its
    // base clears the curve; these two mirror that nudge from either
    // end. A centered arrow is the default above.
    '&:where([data-align="start"])': {
      vars: { [anchorStart]: floating.offset },
    },
    '&:where([data-align="end"])': {
      vars: {
        [anchorStart]: `calc(${WINDOW} - ${floating.offset} - ${floating.arrowBase})`,
      },
    },

    // Tethered, the seat is measured instead: the arrow parks at the
    // start of the edge and its translation along that edge is the whole
    // of it. `data-axis` names the axis facing the anchor, so the edge
    // runs on the other one. Last, so it overrides the alignment rules
    // on source order — the same order the arrow's own rules run in.
    '&:where([data-tethered][data-axis="y"])': {
      vars: { [anchorStart]: floating.arrowX },
    },
    '&:where([data-tethered][data-axis="x"])': {
      vars: { [anchorStart]: floating.arrowY },
    },

    // The crossing the pointer is actually making, which beats the one
    // the arrow points at. While the pointer is still on its way over,
    // the taper comes down on where it left the trigger instead of on
    // the arrow's seat, so a diagonal approach is inside the strip.
    //
    // Clamped to the trigger, which is where the pointer is. Last of
    // the seat rules, so it overrides both the alignment and the
    // measured arrow.
    '&:where([data-path="enter"])': {
      vars: {
        [anchorStart]: `clamp(${anchorInsetStart}, calc(${cursor} - ${floating.arrowBase} / 2), calc(${WINDOW} - ${anchorInsetEnd} - ${floating.arrowBase}))`,
      },
    },

    // The way back, which is the same strip turned around: the end on
    // the window comes down on where the pointer left the surface, and
    // the end on the trigger widens to the whole of it, so a pointer
    // heading for any part of the trigger arrives. Not a taper onto the
    // pointer as on the way over, but a band the trigger's width: a
    // narrow end in the window's corner over a small trigger skews the
    // strip into a sliver nobody could follow. Clamped to the window,
    // which is where the pointer is.
    '&:where([data-path="leave"])': {
      vars: {
        [windowStart]: `clamp(0px, calc(${cursor} - ${EXIT} / 2), calc(${WINDOW} - ${EXIT}))`,
        [windowSpan]: EXIT,
        [anchorStart]: anchorInsetStart,
        [anchorSpan]: `calc(${ANCHOR})`,
      },
    },

    // Which edge it hangs off, and which way round it sits. The edge is
    // the one facing the trigger, pushed out by the gap so the strip
    // meets the trigger and goes no further; the two vars then put the
    // window's end against the surface and the trigger's against the
    // trigger, so a pointer making the crossing is inside the strip and
    // one wandering off isn't.
    '&:where([data-side="top"])::before': {
      bottom: `calc(-1 * ${floating.sideOffset})`,
      vars: { [windowEdge]: '0%', [anchorEdge]: '100%' },
    },
    '&:where([data-side="bottom"])::before': {
      top: `calc(-1 * ${floating.sideOffset})`,
      vars: { [windowEdge]: '100%', [anchorEdge]: '0%' },
    },
    '&:where([data-side="left"])::before': {
      right: `calc(-1 * ${floating.sideOffset})`,
      vars: { [windowEdge]: '0%', [anchorEdge]: '100%' },
    },
    '&:where([data-side="right"])::before': {
      left: `calc(-1 * ${floating.sideOffset})`,
      vars: { [windowEdge]: '100%', [anchorEdge]: '0%' },
    },
  },
});
