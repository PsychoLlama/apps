import { style } from '@vanilla-extract/css';
import { background, radius, space } from '@lib/design';

/**
 * Padding around the panel so its elevation shadow clears the grid's x-scroll
 * clip — the grid only pads the block axis, and the deepest shadows spread well
 * past that.
 */
export const cell = style({ padding: space[7] });

/** Raised panel carrying the elevation shadow (via `--shadow`). */
export const panel = style({
  width: space[8],
  height: space[8],
  backgroundColor: background.panelSolid,
  borderRadius: radius[4],
  boxShadow: 'var(--shadow)',
});
