import { style } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';

/** A single solid color cell — a small, fixed landscape rectangle. Fill is set inline. */
export const swatch = style({
  width: space[9],
  height: space[6],
  borderRadius: radius[2],
});
