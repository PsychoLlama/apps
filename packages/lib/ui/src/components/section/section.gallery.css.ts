import { style } from '@vanilla-extract/css';
import { neutral, radius, space } from '@lib/design';
import { hatch } from '../../gallery/hatch.css';

/**
 * Tinted surface so the section's vertical padding reads as the gap between
 * its edges and the content it wraps. A step lighter than the hatch base so
 * the placeholder reads against it.
 */
export const frame = style({
  backgroundColor: neutral.alpha[2],
  borderRadius: radius[3],
});

/** Placeholder content the section pads above and below. */
export const content = style([hatch, { width: space[9], height: space[6] }]);
