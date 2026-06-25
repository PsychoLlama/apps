import { style } from '@vanilla-extract/css';
import { space } from '@lib/design';
import { hatch } from '#gallery/style';

/** Fixed-width card so each inset's bleed reads consistently across the grid. */
export const card = style({
  width: '12rem',
});

/**
 * Placeholder media for the inset to bleed. The shared hatch marks it as a
 * stand-in for real content, matching the other layout listings.
 */
export const media = style([hatch, { height: space[8] }]);
