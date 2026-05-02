import { style } from '@vanilla-extract/css';

/** Caps the gallery cell so a horizontal slider has a finite track. */
export const galleryCell = style({
  width: '12rem',
});

/** Horizontal playground container — gives the slider a track to fill. */
export const playgroundHorizontal = style({
  width: '16rem',
});

/** Vertical playground container — flips axis so the slider has height. */
export const playgroundVertical = style({
  height: '12rem',
});
