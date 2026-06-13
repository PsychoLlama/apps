import { style } from '@vanilla-extract/css';

/**
 * Width cap for the Progress Playground. Progress is `flex-grow: 1` and
 * would collapse to zero when rendered as a story root, so the decorator
 * needs a fixed parent width.
 */
export const playgroundFrame = style({
  width: '20rem',
});
