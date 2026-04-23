import { style } from '@vanilla-extract/css';
import { neutralAlpha, space } from '@lib/design';

const stripes = [
  `repeating-linear-gradient(`,
  `-45deg,`,
  `${neutralAlpha[3]},`,
  `${neutralAlpha[3]} 8px,`,
  `${neutralAlpha[4]} 8px,`,
  `${neutralAlpha[4]} 16px`,
  `)`,
].join(' ');

export const media = style({
  height: space[9],
  background: stripes,
});
