import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

const stripes = [
  `repeating-linear-gradient(`,
  `-45deg,`,
  `${neutral.alpha[3]},`,
  `${neutral.alpha[3]} 5px,`,
  `${neutral.alpha[4]} 5px,`,
  `${neutral.alpha[4]} 10px`,
  `)`,
].join(' ');

export const swatch = style({
  aspectRatio: '1 / 1',
  minWidth: space[9],
  borderRadius: radius[2],
  background: stripes,
});
