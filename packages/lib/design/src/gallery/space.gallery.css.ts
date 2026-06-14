import { createVar, style } from '@vanilla-extract/css';
import { background, radius, shadow, space } from '@lib/design';

/** Spacing step driving the bar's width, supplied per cell via `assignInlineVars`. */
export const spaceVar = createVar();

/**
 * A bar whose width equals the spacing step (via {@link spaceVar}). Fixed height
 * and a slight shadow keep each bar legible as the column tracks step wider.
 */
export const bar = style({
  width: spaceVar,
  height: space[6],
  backgroundColor: background.panelSolid,
  boxShadow: shadow[2],
  borderRadius: radius[1],
});
