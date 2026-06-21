import { createVar, style } from '@vanilla-extract/css';
import { neutral, space } from '@lib/design';
import { hatch } from './hatch.css';

/** Corner rounding for the box, supplied per cell via `assignInlineVars`. */
export const radiusVar = createVar();

/**
 * A fixed square whose corner rounding rides in via {@link radiusVar}. Carries
 * the shared {@link hatch} fill so the box reads as a for-show sample, and a
 * subtle border so the rounded corners stay crisp against the canvas.
 */
export const box = style([
  hatch,
  {
    width: space[8],
    height: space[8],
    border: `1px solid ${neutral.solid[6]}`,
    borderRadius: radiusVar,
  },
]);
