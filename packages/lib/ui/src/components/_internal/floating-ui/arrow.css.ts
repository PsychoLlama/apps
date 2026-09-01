import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Distance an edge-aligned arrow is pushed off the surface's rounded
 * corner. The window assigns it from its `radius` (see
 * `arrowRadiusOffset`); an unset var falls back to `0`.
 */
export const offset = createVar();

/**
 * The tether's resolved arrow position, in px from the surface's
 * leading edge along the edge the arrow sits on. Only meaningful while
 * the window is tethered, where it replaces `align-self` seating
 * outright rather than adjusting it.
 */
export const tetherOffset = createVar();

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
 * Under a tethered window the arrow is measured against the anchor
 * instead: it collapses to the start of the edge and rides out to the
 * offset `@floating-ui/dom` centers it on, so it keeps pointing at the
 * anchor after the surface has flipped or slid.
 */
export const arrow = style({
  selectors: {
    // Hidden, not unmounted: the arrow keeps its box so the tether can
    // keep measuring its seat while it waits offscreen of the anchor.
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

    // The tether's seat, on whichever axis the arrow rides along. Held
    // unconditionally — untethered the offset is `0`, so the translation
    // is an identity, but it still lifts the arrow into its own stacking
    // context. That's load-bearing: without it the surface's box-shadow
    // composites over the arrow, and among static flex siblings DOM order
    // won't reorder it (only a stacking context will). Declaring it here
    // rather than under `[data-tethered]` keeps both states painting the
    // same, instead of leaving the untethered one to bleed.
    '&:where([data-direction="up"], [data-direction="down"])': {
      translate: `${fallbackVar(tetherOffset, '0px')} 0`,
    },
    '&:where([data-direction="left"], [data-direction="right"])': {
      translate: `0 ${fallbackVar(tetherOffset, '0px')}`,
    },

    // Tethered: `flex-start` puts the arrow's leading edge at the
    // surface's, which is the origin the tether's offset is measured
    // from, so the translation above seats it.
    '[data-tethered] &': {
      alignSelf: 'flex-start',
      margin: 0,
    },
  },
});
