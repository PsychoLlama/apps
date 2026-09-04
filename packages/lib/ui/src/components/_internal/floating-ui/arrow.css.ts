import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Distance an edge-aligned arrow is pushed off the surface's rounded
 * corner. The window assigns it from its `radius` (see
 * `arrowRadiusOffset`); an unset var falls back to `0`.
 */
export const offset = createVar();

/**
 * Seats the arrow along the anchor edge via `align-self` — the cross axis
 * of the window's arrow/body stack. `data-align` maps to the same
 * endpoints as the surface's own alignment: `start` hugs the top
 * (left/right sides) or left (top/bottom sides), `end` the opposite.
 *
 * A `start`/`end` arrow is nudged in by {@link offset} so its base clears
 * the surface's rounded corner instead of riding up onto the curve. The
 * nudge lands on whichever axis the arrow stacks against — inline for
 * up/down arrows (horizontal edge), block for left/right (vertical edge).
 *
 * The arrow carries a stacking context of its own, which is
 * load-bearing rather than cosmetic: without one the surface's
 * `box-shadow` composites over the arrow, and among static flex siblings
 * DOM order alone won't reorder it. `isolation` says exactly that and
 * nothing else, so it can't be mistaken for layout.
 */
export const arrow = style({
  isolation: 'isolate',
  selectors: {
    // Hidden, not unmounted: the arrow keeps its box, so a measured seat
    // stays measurable while it waits offscreen of the anchor.
    '&[data-hidden]': { visibility: 'hidden' },

    '&[data-align="start"]': { alignSelf: 'flex-start' },
    '&[data-align="center"]': { alignSelf: 'center' },
    '&[data-align="end"]': { alignSelf: 'flex-end' },

    '&[data-direction="up"][data-align="start"], &[data-direction="down"][data-align="start"]':
      { marginInlineStart: fallbackVar(offset, '0px') },
    '&[data-direction="up"][data-align="end"], &[data-direction="down"][data-align="end"]':
      { marginInlineEnd: fallbackVar(offset, '0px') },
    '&[data-direction="left"][data-align="start"], &[data-direction="right"][data-align="start"]':
      { marginBlockStart: fallbackVar(offset, '0px') },
    '&[data-direction="left"][data-align="end"], &[data-direction="right"][data-align="end"]':
      { marginBlockEnd: fallbackVar(offset, '0px') },
  },
});
