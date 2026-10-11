import { style } from '@vanilla-extract/css';
import { breakpoint, space } from '@lib/design';

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

/**
 * The two ways in. Stacked and full-width on a phone, where a button is a
 * thumb target and the column is only as wide as the screen; a row from `xs`
 * up, where stretching two buttons across the measure would make each one a
 * banner rather than a control.
 *
 * `alignItems: start` is what keeps them their own width in the row — without
 * it the flex default stretches both to the tallest, and a pair of buttons
 * with nothing beside them has no reason to be as tall as the row.
 *
 * Set here rather than by `Flex`'s `direction` prop because the axis is a
 * width, and a width is something CSS knows and a prop doesn't.
 */
export const actions = style({
  flexDirection: 'column',
  '@media': {
    [breakpoint.xs]: {
      flexDirection: 'row',
      alignItems: 'start',
      gap: space[3],
    },
  },
});
