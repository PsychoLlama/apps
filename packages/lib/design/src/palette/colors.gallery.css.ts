import { style } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';

/** A single solid color cell — small, fixed, and square. Fill is set inline. */
export const swatch = style({
  width: space[6],
  height: space[6],
  borderRadius: radius[2],
});
