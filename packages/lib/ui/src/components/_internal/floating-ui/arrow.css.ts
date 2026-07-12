import { createVar, fallbackVar, style } from '@vanilla-extract/css';

/**
 * Distance an edge-aligned arrow is pushed off the surface's rounded
 * corner. The container assigns it from its `radius` (see
 * `arrowRadiusOffset`); an unset var falls back to `0`.
 */
export const offset = createVar();

/**
 * Override slots: a pixel nudge applied on top of the arrow's seated
 * position, one var per axis. The tether assigns these on the container
 * (they inherit down) to center the arrow over the anchor after
 * collision adjustments; unset they fall back to `0`.
 */
export const shiftX = createVar();
export const shiftY = createVar();

/**
 * Seats the arrow along the anchor edge via `align-self` — the cross axis
 * of the container's arrow/body stack. `data-align` maps to the same
 * endpoints as the surface's own alignment: `start` hugs the top
 * (left/right sides) or left (top/bottom sides), `end` the opposite.
 *
 * A `start`/`end` arrow is nudged in by {@link offset} so its base clears
 * the surface's rounded corner instead of riding up onto the curve. The
 * nudge lands on whichever axis the arrow stacks against — inline for
 * up/down arrows (horizontal edge), block for left/right (vertical edge).
 */
export const arrow = style({
  translate: `${fallbackVar(shiftX, '0px')} ${fallbackVar(shiftY, '0px')}`,
  selectors: {
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
