import { style } from '@vanilla-extract/css';

/**
 * A shared body. Text arrives with the shape it had where it was copied
 * from, so the newlines are kept rather than collapsed — a pasted address or
 * a snippet of code is unreadable as one run-on line.
 *
 * `anywhere` because a share is frequently a URL: one unbroken hundred-
 * character token with nowhere to wrap would otherwise widen the row past
 * the screen it's being read on.
 */
export const body = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});

/**
 * Who a row is from. The peer's name has no length limit, so it gives way
 * rather than pushing the timestamp off the end of the row. `minWidth: 0`
 * opts out of the flex item's automatic minimum, which would otherwise floor
 * it at the width of its own text and defeat the truncation.
 */
export const author = style({
  minWidth: 0,
});
