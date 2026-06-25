import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';
import { hatch } from '../../gallery/hatch.css';

/**
 * The available space the container lays its column out within. Pinned wider
 * than the largest size cap (`71rem`) so every max-width preset reads as a
 * distinct column and `align` has room to shift it.
 */
export const frame = style({
  width: '76rem',
  paddingInline: space[2],
  backgroundColor: neutral.alpha[2],
  borderRadius: radius[3],
});

/**
 * The capped column. Fills the container's inner width so its size tracks the
 * active max-width preset and its position tracks `align`; the shared hatch
 * marks it as a for-show placeholder rather than real content.
 */
export const column = style([hatch, { height: space[8] }]);
