import { style } from '@vanilla-extract/css';

/**
 * A header icon, or the button around one. A tooltip wraps its trigger
 * in a block, and an inline trigger sits on a line in it: the block comes
 * out as tall as a line of text, with the icon at its top. A block-level
 * trigger has no line, so the wrapper is the icon's height and the row
 * can center it.
 */
export const icon = style({
  display: 'flex',
  alignItems: 'center',
});
