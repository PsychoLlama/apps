import { createVar, style } from '@vanilla-extract/css';
import { radius, space } from '@lib/design';

/** Elevation shadow for the panel, supplied per cell via `assignInlineVars`. */
export const shadowVar = createVar();

/**
 * Panel carrying the elevation shadow (via {@link shadowVar}). Matches the radius
 * gallery's box — same size and corners, no fill — so the two scales read as one
 * object: one varying its corners, the other its elevation. No border, unlike the
 * radius box: the lowest shadow levels already draw a hairline edge, so a border
 * on top would double it up.
 */
export const panel = style({
  width: space[8],
  height: space[8],
  borderRadius: radius[4],
  boxShadow: shadowVar,
});
