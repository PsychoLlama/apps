import { style } from '@vanilla-extract/css';
import { accent, space } from '@lib/design';

/** Fixed-width card so each inset's bleed reads consistently across the grid. */
export const card = style({
  width: '18rem',
});

/**
 * Placeholder media for the inset to bleed. A solid fill with no radius of its
 * own, so the corner rounding comes entirely from the Inset's `clip` region.
 */
export const media = style({
  height: space[8],
  backgroundColor: accent.solid[9],
});
