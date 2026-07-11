import { style } from '@vanilla-extract/css';
import { neutral, radius } from '@lib/design';

/**
 * The shrunk hatch box the floating window anchors against. Kept small
 * and centered in its stage so the window stays visible whichever side
 * it binds to. Diagonal hatching makes the box's bounds obvious.
 */
export const anchorBox = style({
  width: '12rem',
  height: '8rem',
  borderRadius: radius[4],
  border: `1px dashed ${neutral.solid[7]}`,
  backgroundColor: neutral.solid[2],
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[4]} 0, ${neutral.alpha[4]} 1px, transparent 1px, transparent 10px)`,
});
