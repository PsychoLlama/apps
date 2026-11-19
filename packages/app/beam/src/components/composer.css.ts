import { style } from '@vanilla-extract/css';

/**
 * The file input behind the attach button. Out of sight and out of the
 * layout, and still in the document: a picker can only be opened from an
 * input that's attached.
 */
export const picker = style({
  display: 'none',
});
