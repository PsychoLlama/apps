import { style } from '@vanilla-extract/css';
import { neutralAlpha, space } from '#design';

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
  borderRadius: '4px',
  background: stripes,
});
