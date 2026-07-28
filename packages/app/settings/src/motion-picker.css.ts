import { style } from '@vanilla-extract/css';

/**
 * Sizes the track to its segments instead of letting the column flex
 * stretch it edge to edge. Mirrors the appearance picker — keeps the two
 * settings sections visually consistent.
 */
export const control = style({
  alignSelf: 'flex-start',
});
