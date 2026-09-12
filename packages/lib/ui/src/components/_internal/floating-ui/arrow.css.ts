import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Distance an edge-aligned arrow is pushed off the surface's rounded
 * corner. The window assigns it from its `radius` (see
 * `radiusVariants`); an unset var falls back to `0`.
 */
export const offset = createVar();

/**
 * Translation of the arrow along each axis, in px. Mirrors the tether's
 * `middlewareData.arrow.x`/`.y`: the window assigns whichever axis runs
 * along the anchor edge from its measurement and leaves the other at
 * zero. Only read under a tethered window, which zeroes both, so an
 * arrow nested inside another float never inherits a neighbor's.
 */
export const translateX = createVar();
export const translateY = createVar();

/**
 * Seats the arrow along the anchor edge via `align-self` — the cross axis
 * of the window's arrow/body stack. `data-align` maps to the same
 * endpoints as the window's own alignment: `start` hugs the top
 * (left/right sides) or left (top/bottom sides), `end` the opposite.
 *
 * A `start`/`end` arrow is nudged in by {@link offset} so its base clears
 * the surface's rounded corner instead of riding up onto the curve. The
 * nudge lands on whichever axis the arrow stacks against — inline for
 * up/down arrows (horizontal edge), block for left/right (vertical edge).
 *
 * Under a tethered window the seat is measured rather than aligned: the
 * arrow parks at the start of the edge with alignment and the corner
 * nudge zeroed, and the translation by {@link translateX} /
 * {@link translateY} is the whole seat.
 *
 * A translation is always in effect, if only by zero, and that is
 * load-bearing in both modes: it gives the arrow a stacking context of
 * its own, so it paints over the surface's `box-shadow`. Among static
 * flex siblings DOM order alone won't — the body comes later and would
 * composite its shadow over the arrow. The base zero is a literal, not
 * the vars, so an untethered arrow never reads a value it wasn't given.
 *
 * Every selector is wrapped in `:where(...)` so the rules hold equal
 * specificity and the cascade resolves by source order — the tethered
 * reset sits last so it overrides the alignment rules.
 */
export const arrow = style({
  translate: '0px 0px',
  selectors: {
    // Hidden, not unmounted: the arrow keeps its box, so a measured seat
    // stays measurable while it waits offscreen of the anchor.
    '&:where([data-hidden])': { visibility: 'hidden' },

    '&:where([data-align="start"])': { alignSelf: 'flex-start' },
    '&:where([data-align="center"])': { alignSelf: 'center' },
    '&:where([data-align="end"])': { alignSelf: 'flex-end' },

    // Up/down arrows sit on a horizontal edge, so the nudge is inline;
    // left/right on a vertical edge, so it's block.
    '&:where([data-direction="up"], [data-direction="down"]):where([data-align="start"])':
      { marginInlineStart: fallbackVar(offset, '0px') },
    '&:where([data-direction="up"], [data-direction="down"]):where([data-align="end"])':
      { marginInlineEnd: fallbackVar(offset, '0px') },
    '&:where([data-direction="left"], [data-direction="right"]):where([data-align="start"])':
      { marginBlockStart: fallbackVar(offset, '0px') },
    '&:where([data-direction="left"], [data-direction="right"]):where([data-align="end"])':
      { marginBlockEnd: fallbackVar(offset, '0px') },

    // Tethered: alignment and the corner nudge are moot; the translation
    // above is the whole seat.
    ':where([data-tethered]) > &': {
      alignSelf: 'flex-start',
      margin: 0,
      translate: `${translateX} ${translateY}`,
    },
  },
});
