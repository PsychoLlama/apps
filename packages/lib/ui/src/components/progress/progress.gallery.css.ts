import { style } from '@vanilla-extract/css';

/**
 * Width cap for the Progress gallery cells. Progress is `flex-grow: 1`
 * and would collapse to zero when rendered as a cell root, so each cell
 * needs a fixed parent width.
 */
export const galleryCell = style({
  width: '12rem',
});
