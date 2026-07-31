import { style } from '@vanilla-extract/css';
import { breakpoint, space } from '@lib/design';

/**
 * A contact row — the anchor itself, filled out to the width of the list.
 *
 * Every override is against the ghost variant's inline-button defaults, and
 * `&&` doubles the class specificity so they land regardless of stylesheet
 * order. Ghost retracts its own padding back out of the layout box so a button
 * sits flush with the text beside it; a stack of rows needs that undone
 * vertically, where it would lap each row over its neighbour, and kept
 * horizontally, where it's exactly right.
 *
 * So the rows hang out of their column by their own inline padding. Inline on
 * the home page that lands the names on the page's gutter, in the same column
 * as the heading above them and the buttons below — the padding stays, as the
 * slack around a tap, but stops pushing the text out of line with everything
 * else on the page.
 *
 * The rail has no gutter to line up with, and a row already reaches both its
 * edges, so there the retraction goes away and the padding is just padding.
 *
 * The height is the last of it. Ghost sizes to its text, and a row in an
 * address book is a thumb target rather than a word in a sentence.
 */
export const row = style({
  selectors: {
    '&&': {
      alignSelf: 'stretch',
      minHeight: space[7],
      justifyContent: 'space-between',
      marginBlock: 0,
      marginInline: `calc(-1 * ${space[3]})`,
    },
  },
  '@media': {
    [breakpoint.md]: {
      selectors: {
        '&&': { marginInline: 0 },
      },
    },
  },
});

/**
 * The contact's name. Truncation needs the block display — an inline box has
 * no width to overflow — and `minWidth: 0` to opt out of the flex item's
 * automatic minimum, which would otherwise floor the name at the width of its
 * own text and push the badges off the row instead.
 */
export const name = style({
  display: 'block',
  minWidth: 0,
});
