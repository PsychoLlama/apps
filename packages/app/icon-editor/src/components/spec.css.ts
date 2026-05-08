import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

export const bar = style({
  width: '100%',
  paddingBlock: space[2],
  paddingInline: space[3],
  borderRadius: radius[2],
  backgroundColor: neutral.alpha[2],
});

export const dot = style({
  color: neutral.solid[8],
});
