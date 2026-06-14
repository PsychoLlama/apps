import { createVar, style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';

/** Corner rounding for the box, supplied per cell via `assignInlineVars`. */
export const radiusVar = createVar();

/**
 * A fixed square whose corner rounding rides in via {@link radiusVar}. Outlined
 * with a subtle border so the rounded corners read against the canvas.
 */
export const box = style({
  width: space[8],
  height: space[8],
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radiusVar,
});
