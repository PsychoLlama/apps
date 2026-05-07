import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

export const frame = style({
  width: '16rem',
  height: '12rem',
  border: `1px solid ${neutral.alpha[6]}`,
  borderRadius: radius[3],
  backgroundColor: neutral.alpha[2],
});

export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: space[2],
  padding: space[4],
});

export const wide = style({
  display: 'flex',
  flexDirection: 'row',
  gap: space[3],
  padding: space[4],
  width: 'max-content',
});

export const tile = style({
  width: '4rem',
  height: '4rem',
  backgroundColor: neutral.alpha[4],
  borderRadius: radius[2],
  flexShrink: 0,
});
