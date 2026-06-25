import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';

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
 * active max-width preset and its position tracks `align`. A faint diagonal
 * hatch behind a hairline outline marks it as a for-show placeholder rather
 * than real content.
 */
export const column = style({
  height: space[8],
  borderRadius: radius[1],
  border: `1px solid ${neutral.alpha[5]}`,
  backgroundColor: neutral.alpha[3],
  // Radix's hatch, translated from its 6×6 SVG tile: a 1-unit-thick diagonal
  // band (the strip between x+y=5 and x+y=6) repeated every 6 units. Projected
  // onto the 45° gradient line those axis distances shrink by √2 — a 1/√2px
  // (≈0.7071) stripe on a 6/√2px (≈4.2426) period, a 1/6 duty cycle. Clipped to
  // the padding box so the stripes stay inside the border instead of bleeding
  // under it.
  backgroundImage: `repeating-linear-gradient(-45deg, ${neutral.alpha[5]} 0, ${neutral.alpha[5]} 0.7071px, transparent 0.7071px, transparent 4.2426px)`,
  backgroundClip: 'padding-box',
});
