import { style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

const stripes = [
  `repeating-linear-gradient(`,
  `-45deg,`,
  `${neutral.alpha[3]},`,
  `${neutral.alpha[3]} 8px,`,
  `${neutral.alpha[4]} 8px,`,
  `${neutral.alpha[4]} 16px`,
  `)`,
].join(' ');

export const cover = style({
  height: space[9],
  background: stripes,
});

export const layout = style({
  maxWidth: '32rem',
});
