import { style } from '@vanilla-extract/css';
import { neutral, space } from '#design';

export const radiusGrid = style({
  gridTemplateColumns: `repeat(auto-fill, ${space[9]})`,
});

export const radiusBox = style({
  aspectRatio: '1',
  backgroundColor: neutral[9],
});
