import { style } from '@vanilla-extract/css';
import { background, radius, shadow, space } from '@lib/design';

/**
 * A bar whose width equals the spacing step (via `--space`). Fixed height and a
 * slight shadow keep each bar legible as the column tracks step wider.
 */
export const bar = style({
  width: 'var(--space)',
  height: space[6],
  backgroundColor: background.panelSolid,
  boxShadow: shadow[2],
  borderRadius: radius[1],
});
