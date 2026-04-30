import { style } from '@vanilla-extract/css';
import { accent, neutral, radius, space } from '@lib/design';

const TRACK_HEIGHT = space[2];
const THUMB_SIZE = space[4];
const THUMB_OFFSET = `calc((${TRACK_HEIGHT} - ${THUMB_SIZE}) / 2)`;

export const slider = style({
  flex: '1 1 auto',
  height: space[4],
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'transparent',
  cursor: 'pointer',
  ':focus-visible': {
    outline: 'none',
  },
  // Native range styling targets vendor pseudo-elements on the same
  // element. `&::pseudo` keeps each rule scoped to this slider.
  selectors: {
    '&::-webkit-slider-runnable-track': {
      height: TRACK_HEIGHT,
      borderRadius: radius.full,
      backgroundColor: neutral.solid[4],
    },
    '&::-moz-range-track': {
      height: TRACK_HEIGHT,
      borderRadius: radius.full,
      backgroundColor: neutral.solid[4],
    },
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      marginTop: THUMB_OFFSET,
      borderRadius: radius.full,
      backgroundColor: accent.solid[9],
      border: `2px solid ${accent.solid[12]}`,
      cursor: 'grab',
    },
    '&::-moz-range-thumb': {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: radius.full,
      backgroundColor: accent.solid[9],
      border: `2px solid ${accent.solid[12]}`,
      cursor: 'grab',
    },
    '&:focus-visible::-webkit-slider-thumb': {
      boxShadow: `0 0 0 4px ${accent.alpha[5]}`,
    },
    '&:focus-visible::-moz-range-thumb': {
      boxShadow: `0 0 0 4px ${accent.alpha[5]}`,
    },
  },
});

export const value = style({
  minWidth: '4ch',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: neutral.solid[11],
});
