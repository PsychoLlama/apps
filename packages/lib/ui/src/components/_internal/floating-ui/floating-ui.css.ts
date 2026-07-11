import { style } from '@vanilla-extract/css';

/**
 * Anchor target — establishes the positioning context an absolutely
 * positioned floating surface resolves against. Apply to whatever
 * element a floating primitive should anchor to.
 */
export const anchor = style({
  position: 'relative',
});

/**
 * Positioning shell for the floating surface. `data-side` places it
 * fully outside the chosen edge of the anchor; `data-align` positions it
 * along that edge — `start` hugs the top/left, `end` the bottom/right.
 */
export const container = style({
  position: 'absolute',
  selectors: {
    // Push fully outside the chosen edge.
    '&[data-side="top"]': { bottom: '100%' },
    '&[data-side="bottom"]': { top: '100%' },
    '&[data-side="left"]': { right: '100%' },
    '&[data-side="right"]': { left: '100%' },

    // Align along a horizontal edge (top/bottom): start=left … end=right.
    '&[data-side="top"][data-align="start"], &[data-side="bottom"][data-align="start"]':
      { left: 0 },
    '&[data-side="top"][data-align="center"], &[data-side="bottom"][data-align="center"]':
      { left: '50%', transform: 'translateX(-50%)' },
    '&[data-side="top"][data-align="end"], &[data-side="bottom"][data-align="end"]':
      { right: 0 },

    // Align along a vertical edge (left/right): start=top … end=bottom.
    '&[data-side="left"][data-align="start"], &[data-side="right"][data-align="start"]':
      { top: 0 },
    '&[data-side="left"][data-align="center"], &[data-side="right"][data-align="center"]':
      { top: '50%', transform: 'translateY(-50%)' },
    '&[data-side="left"][data-align="end"], &[data-side="right"][data-align="end"]':
      { bottom: 0 },
  },
});

/**
 * The visual surface. Caps how large floating content can grow so a
 * window never overruns the viewport.
 */
export const body = style({
  maxWidth: '20rem',
  maxHeight: '20rem',
});
