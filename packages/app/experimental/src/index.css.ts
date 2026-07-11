import { style } from '@vanilla-extract/css';
import { neutral, radius } from '@lib/design';

/**
 * A visible placeholder surface for the floating primitive to anchor
 * against while we build it out. Diagonal hatching makes the box's
 * bounds obvious; it fills the frame body so there's room to position
 * within.
 */
export const anchorBox = style({
  flex: 1,
  borderRadius: radius[4],
  border: `1px dashed ${neutral.solid[7]}`,
  backgroundColor: neutral.solid[2],
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[4]} 0, ${neutral.alpha[4]} 1px, transparent 1px, transparent 10px)`,
});
