import { createVar, style } from '@vanilla-extract/css';
import { background, radius, space } from '@lib/design';

/** Elevation shadow for the panel, supplied per cell via `assignInlineVars`. */
export const shadowVar = createVar();

/** Raised panel carrying the elevation shadow (via {@link shadowVar}). */
export const panel = style({
  width: space[8],
  height: space[8],
  backgroundColor: background.panelSolid,
  borderRadius: radius[4],
  boxShadow: shadowVar,
});
