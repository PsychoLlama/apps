import { style } from '@vanilla-extract/css';
import { accent, space } from '@lib/design';

/**
 * A contact row — the anchor itself, filled out to the width of the list.
 *
 * Both overrides are against the ghost variant's inline-button defaults, and
 * `&&` doubles the class specificity so they land regardless of stylesheet
 * order. The margin is the notable one: ghost retracts its own padding back
 * out of the layout box so a button sits flush with the text beside it, which
 * for a stack of rows would lap each one over its neighbour.
 *
 * The height is the other. Ghost sizes to its text, and a row in an address
 * book is a thumb target rather than a word in a sentence.
 */
export const row = style({
  selectors: {
    '&&': {
      width: '100%',
      minHeight: space[7],
      justifyContent: 'space-between',
      margin: 0,
    },
  },
});

/**
 * The row whose peer is the one on screen. Only ever visible in the sidebar,
 * where the list survives the navigation it caused — a page that replaces the
 * list it was tapped in has nothing left to mark.
 *
 * Only the fill is set here; the row itself switches to the accent color when
 * it's current, so the text and the hover and active fills come along with it.
 * That's what keeps this to one declaration: the tint below matches the fill
 * ghost would paint on hover anyway, so the current row simply looks hovered
 * already, which is the truth of it.
 */
export const currentRow = style({
  selectors: {
    '&&': {
      backgroundColor: accent.alpha[3],
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
