import { style } from '@vanilla-extract/css';
import { breakpoint } from '@lib/design';

/**
 * The inline copy of the address book. It's the whole point of this page on a
 * phone, and redundant the moment the frame's rail appears beside it — so it
 * stands down at exactly the width the rail stands up.
 *
 * The mirror of `contact-sidebar.css`'s rule, and deliberately so: one of the
 * two is always showing, and the pair has to be read together to see that.
 */
export const directory = style({
  '@media': {
    [breakpoint.md]: { display: 'none' },
  },
});
