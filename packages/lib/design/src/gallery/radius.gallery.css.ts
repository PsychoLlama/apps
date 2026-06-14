import { style } from '@vanilla-extract/css';
import { background, shadow, space } from '@lib/design';

/**
 * A fixed square whose corner rounding rides in via `--radius`. Raised off the
 * page with a slight shadow so the rounded corners read against the canvas.
 */
export const box = style({
  width: space[8],
  height: space[8],
  backgroundColor: background.panelSolid,
  boxShadow: shadow[2],
  borderRadius: 'var(--radius)',
});
