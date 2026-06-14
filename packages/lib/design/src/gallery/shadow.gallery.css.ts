import { createVar, style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

/** Elevation shadow for the panel, supplied per cell via `assignInlineVars`. */
export const shadowVar = createVar();

/**
 * Panel carrying the elevation shadow (via {@link shadowVar}). Reuses the radius
 * gallery's chrome verbatim — same size, the same hairline border, no fill — so
 * the two scales read as one object: one varying its corners, the other its
 * elevation.
 */
export const panel = style({
  width: space[8],
  height: space[8],
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[4],
  boxShadow: shadowVar,
});
