import { style } from '@vanilla-extract/css';
import { neutral, space } from '#design';

export const radiusGrid = style({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${space[9]})`,
  gap: space[5],
  alignItems: 'end',
});

export const radiusBox = style({
  aspectRatio: '1',
  backgroundColor: neutral[9],
});
