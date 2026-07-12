import { style, styleVariants } from '@vanilla-extract/css';
import { radius } from '@lib/design';
import { offset } from './arrow.css';

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
 *
 * A flexbox lays out the arrow and body. Each side sets its own
 * `flex-direction`, which seats the DOM-first arrow onto the edge facing
 * the anchor (reversed for top/left).
 */
export const container = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  selectors: {
    // Push fully outside the chosen edge, and orient the arrow-first
    // axis so the arrow lands on the anchor-facing edge.
    '&[data-side="top"]': { bottom: '100%', flexDirection: 'column-reverse' },
    '&[data-side="bottom"]': { top: '100%', flexDirection: 'column' },
    '&[data-side="left"]': { right: '100%', flexDirection: 'row-reverse' },
    '&[data-side="right"]': { left: '100%', flexDirection: 'row' },

    // Align along a horizontal edge (top/bottom): start=left … end=right.
    '&[data-side="top"][data-align="start"], &[data-side="bottom"][data-align="start"]':
      {
        left: 0,
      },

    '&[data-side="top"][data-align="center"], &[data-side="bottom"][data-align="center"]':
      {
        left: '50%',
        transform: 'translateX(-50%)',
      },

    '&[data-side="top"][data-align="end"], &[data-side="bottom"][data-align="end"]':
      {
        right: 0,
      },

    // Align along a vertical edge (left/right): start=top … end=bottom.
    '&[data-side="left"][data-align="start"], &[data-side="right"][data-align="start"]':
      {
        top: 0,
      },

    '&[data-side="left"][data-align="center"], &[data-side="right"][data-align="center"]':
      {
        top: '50%',
        transform: 'translateY(-50%)',
      },

    '&[data-side="left"][data-align="end"], &[data-side="right"][data-align="end"]':
      {
        bottom: 0,
      },
  },
});

/**
 * The visual surface. Sizes to its content so a window hugs what it
 * holds instead of wrapping or stretching to fill the positioning shell.
 */
export const body = style({
  width: 'max-content',
  height: 'max-content',
});

/** Per-step border radius for the surface, keyed by the design scale. */
export const bodyRadius = styleVariants(radius, (value) => ({
  borderRadius: value,
}));

/**
 * Maps the surface radius to the arrow's corner offset. The straight run
 * of a rounded edge begins exactly one radius in from the corner, so a
 * start/end-aligned arrow clears the curve when nudged by that same
 * distance — the offset is the radius value verbatim.
 */
export const arrowRadiusOffset = styleVariants(radius, (value) => ({
  vars: { [offset]: value },
}));
