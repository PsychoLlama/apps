import { style } from '@vanilla-extract/css';

/**
 * The row holding the contacts rail beside the route. Takes the height the
 * frame's chrome leaves it and refuses to grow past it — `min-height: 0` is
 * what keeps the overflow inside the rail and the route body, which each
 * scroll on their own, rather than pushing the status bar off the screen.
 */
export const split = style({
  flex: '1 1 auto',
  minHeight: 0,
});

/**
 * The route's own column, filling whatever the rail leaves. `min-width: 0`
 * opts out of the flex item's automatic minimum, so a wide child — a long
 * unbroken share body, a table — is the child's problem to scroll rather than
 * something that shoves the rail off the viewport.
 */
export const pane = style({
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
});
