import { style } from '@vanilla-extract/css';
import { neutral, space, radius } from '#design';

export const spacingGrid = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: `${space[3]} ${space[4]}`,
  alignItems: 'center',
});

export const spacingBar = style({
  height: space[5],
  backgroundColor: neutral[9],
  borderRadius: radius[1],
});
