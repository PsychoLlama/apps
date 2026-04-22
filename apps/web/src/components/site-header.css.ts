import { style } from '@vanilla-extract/css';
import { neutral, space } from '@psychollama/design';

export const header = style({
  borderBottom: `1px solid ${neutral[6]}`,
  flexShrink: 0,
});

export const divider = style({
  width: '1px',
  height: space[5],
  backgroundColor: neutral[6],
  flexShrink: 0,
});
