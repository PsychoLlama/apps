import { style } from '@vanilla-extract/css';
import { background, breakpoint, neutral, space } from '@lib/design';

/**
 * The contacts rail, beside the route rather than above it. A phone has one
 * screen's worth of room and spends it on the thing you came for, so below
 * `md` the rail isn't there at all and the home page carries the same
 * directory inline.
 *
 * `display: none` rather than a rendering branch: the choice is a width, and a
 * width is something CSS knows before any script does. A JS media query would
 * make a prerendered page briefly wrong at one size or the other.
 *
 * Full height beside the header rather than tucked under it. The header is
 * rendered per route — it's part of what this sits next to — so there's no
 * seam to slide beneath without hoisting every route's breadcrumb into the
 * layout.
 *
 * Scrolls on its own, like the body it sits beside: an address book is
 * unbounded, and a rail that grew with it would take the frame's height with
 * it.
 */
export const sidebar = style({
  display: 'none',
  '@media': {
    [breakpoint.md]: {
      display: 'flex',
      flex: '0 0 auto',
      width: '17rem',
      minHeight: 0,
      overflowY: 'auto',
      padding: space[5],
      borderRight: `1px solid ${neutral.alpha[6]}`,
      backgroundColor: background.page,
    },
    [breakpoint.lg]: { width: '20rem' },
  },
});
