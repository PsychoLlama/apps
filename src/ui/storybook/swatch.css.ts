import { style } from '@vanilla-extract/css';
import { neutralAlpha, radius, space } from '#design';

const stripes = [
  `repeating-linear-gradient(`,
  `-45deg,`,
  `${neutralAlpha[3]},`,
  `${neutralAlpha[3]} 5px,`,
  `${neutralAlpha[4]} 5px,`,
  `${neutralAlpha[4]} 10px`,
  `)`,
].join(' ');

export const swatch = style({
  aspectRatio: '1 / 1',
  minWidth: space[9],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radius[2],
  background: stripes,
});
