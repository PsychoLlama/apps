import { style } from '@vanilla-extract/css';
import { accent, neutral, radius, space } from '@lib/design';

/**
 * Tinted surface so the section's vertical padding reads as the gap between
 * its edges and the content it wraps.
 */
export const frame = style({
  backgroundColor: neutral.alpha[3],
  borderRadius: radius[3],
});

/** Placeholder content the section pads above and below. */
export const content = style({
  width: space[9],
  height: space[6],
  backgroundColor: accent.solid[9],
  borderRadius: radius[1],
});
