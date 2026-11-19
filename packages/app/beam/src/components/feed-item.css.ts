import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';

/**
 * What was shared. Keeps the line breaks it was written with, and breaks
 * anywhere when it must: a long address or token has no spaces to wrap at.
 */
export const body = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

/** One item's row. Named so its actions can tell when it's pointed at. */
export const item = style({});

/**
 * What can be done with an item, right after it. Out of sight until the
 * row is pointed at or holds focus, where there's a pointer to do that
 * with. On a touch screen they're always there.
 *
 * Ghost buttons pull their padding back with negative margins, so the gap
 * is what keeps their hover areas apart.
 */
export const actions = style({
  display: 'flex',
  alignItems: 'center',
  gap: space[4],
  flexShrink: 0,
  '@media': {
    '(hover: hover)': {
      opacity: 0,
      selectors: {
        [`${item}:hover &, ${item}:focus-within &`]: {
          opacity: 1,
        },
      },
    },
  },
});
