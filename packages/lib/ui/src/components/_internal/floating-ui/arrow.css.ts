import { style } from '@vanilla-extract/css';

/**
 * Seats the arrow along the anchor edge via `align-self` — the cross axis
 * of the container's arrow/body stack. `data-align` maps to the same
 * endpoints as the surface's own alignment: `start` hugs the top
 * (left/right sides) or left (top/bottom sides), `end` the opposite.
 */
export const arrow = style({
  selectors: {
    '&[data-align="start"]': { alignSelf: 'flex-start' },
    '&[data-align="center"]': { alignSelf: 'center' },
    '&[data-align="end"]': { alignSelf: 'flex-end' },
  },
});
