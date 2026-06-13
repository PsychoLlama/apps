import { style } from '@vanilla-extract/css';

/** Fixed width so horizontal separators have something to span. */
export const horizontalCell = style({
  width: '8rem',
});

/** Fixed height so vertical separators have something to span. */
export const verticalCell = style({
  height: '3rem',
});
