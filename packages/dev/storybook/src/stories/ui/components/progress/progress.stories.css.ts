import { style } from '@vanilla-extract/css';

/**
 * Width caps for the Progress story cells. Progress is `flex-grow: 1`
 * and would collapse to zero when rendered as a story root, so the
 * gallery cells and the Playground decorator both need a fixed parent
 * width.
 */
export const galleryCell = style({
  width: '12rem',
});

export const playgroundFrame = style({
  width: '20rem',
});
