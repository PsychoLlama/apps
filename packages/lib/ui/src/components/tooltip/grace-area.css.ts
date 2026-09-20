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
 * What it doesn't know is why it's there. Whether to draw it at all, and
 * how long to hold it inert, are the consumer's to say; the two vars
 * exported here are the whole of that conversation.
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

// How far the strip reaches past the surface: across the arrow's row,
// then the gap the window opens off the trigger. Both are the window's,
// assigned from its props.
const REACH = `calc(${floating.arrowDepth} + ${floating.sideOffset})`;

// The strip is a trapezoid: one end on the window, one on the anchor,
// and the four vars below say where each end begins and how far it
// runs. They're measured along the edge the strip spans, from the
// strip's own start, which leaves them free of which side the window
// landed on — that's the two edge vars' job, further down.
//
// All six are declared and assigned on the window, where the placement
// and the arrow's seat are both known, and read by the strip.

/**
 * Where the end against the trigger begins. The arrow's leading corner:
 * the end runs from here for {@link anchorSpan}, so the taper comes
 * down on the arrow wherever the arrow was seated.
 */
const anchorStart = createVar();

/**
 * How far that end runs. The arrow's base today — the taper lands on
 * the arrow and nothing else. A later phase widens it to the trigger.
 */
const anchorSpan = createVar();

/** Where the end against the surface begins. The window's start. */
const windowStart = createVar();

/** How far that end runs. The window, edge to edge. */
const windowSpan = createVar();

// The far corner of each end, for the polygon below.
const anchorEnd = `calc(${anchorStart} + ${anchorSpan})`;
const windowEnd = `calc(${windowStart} + ${windowSpan})`;

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
    [anchorStart]: `calc((100% - ${floating.arrowBase}) / 2)`,
    [anchorSpan]: floating.arrowBase,

    // The window, edge to edge.
    [windowStart]: '0%',
    [windowSpan]: '100%',

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
    // edge, so there's no seam at either end to fall through, and it's
    // as thick as it reaches. `data-axis` names the axis it reaches
    // along, which is the one the thickness lands on.
    //
    // The shape is the same four points either way — an end on the
    // window, an end on the trigger — and the axis only decides which
    // coordinate each var lands in, which is why the two lists are
    // each other with the pairs swapped.
    '&:where([data-axis="y"])::before': {
      insetInline: 0,
      height: REACH,
      clipPath: `polygon(${windowStart} ${windowEdge}, ${windowEnd} ${windowEdge}, ${anchorEnd} ${anchorEdge}, ${anchorStart} ${anchorEdge})`,
    },
    '&:where([data-axis="x"])::before': {
      insetBlock: 0,
      width: REACH,
      clipPath: `polygon(${windowEdge} ${windowStart}, ${windowEdge} ${windowEnd}, ${anchorEdge} ${anchorEnd}, ${anchorEdge} ${anchorStart})`,
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
        [anchorStart]: `calc(100% - ${floating.offset} - ${floating.arrowBase})`,
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

    // Which edge it hangs off, and which way round it sits. The edge is
    // the one facing the trigger, pushed out by the gap so the strip
    // meets the trigger and goes no further; the two vars then put the
    // wide end against the surface and the narrow one against the
    // trigger, so a pointer heading for the tooltip is inside the strip
    // and one wandering off isn't.
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
