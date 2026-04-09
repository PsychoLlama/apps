import { style } from '@vanilla-extract/css';
import { neutral, space } from '#design';

export const spacingGrid = style({
  gridTemplateColumns: 'auto 1fr',
});

export const spacingBar = style({
  height: space[5],
  backgroundColor: neutral[9],
});
