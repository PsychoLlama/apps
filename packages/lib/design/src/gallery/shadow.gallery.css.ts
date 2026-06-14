import { createVar, style } from '@vanilla-extract/css';
import { background, neutral, radius, space } from '@lib/design';

/** Elevation shadow for the panel, supplied per cell via `assignInlineVars`. */
export const shadowVar = createVar();

/**
 * Raised panel carrying the elevation shadow (via {@link shadowVar}). Shares the
 * radius gallery's bordered-square chrome — same size and subtle outline — so the
 * two scales read as the same object, one varying its corners and the other its
 * elevation.
 */
export const panel = style({
  width: space[8],
  height: space[8],
  border: `1px solid ${neutral.solid[6]}`,
  borderRadius: radius[4],
  backgroundColor: background.panelSolid,
  boxShadow: shadowVar,
});
