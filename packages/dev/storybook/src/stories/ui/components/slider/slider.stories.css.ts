import { style } from '@vanilla-extract/css';

/** Horizontal playground container — gives the slider a track to fill. */
export const playgroundHorizontal = style({
  width: '16rem',
});

/** Vertical playground container — flips axis so the slider has height. */
export const playgroundVertical = style({
  height: '12rem',
});
