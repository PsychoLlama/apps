import { style } from '@vanilla-extract/css';
import { breakpoint, space } from '@lib/design';

/**
 * The list's title. Flush with its container by default: inline on the home
 * page it sits inside the page's own gutter, alongside the headings above it,
 * and any inset of its own would only knock it out of that column.
 *
 * The rail has no gutter — the rows run edge to edge and their padding is
 * inside their hit area — so at exactly the width the rail appears, the
 * heading grows the one it's been going without. The measure is a row's own
 * inline padding, which puts the title over the names rather than a few
 * pixels to their left.
 */
export const heading = style({
  '@media': {
    [breakpoint.md]: { paddingInline: space[3] },
  },
});
