import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

export const header = style({
  borderBottom: `1px solid ${neutral.solid[6]}`,
  flexShrink: 0,
});

export const divider = style({
  width: '1px',
  height: space[5],
  backgroundColor: neutral.solid[6],
  flexShrink: 0,
});
