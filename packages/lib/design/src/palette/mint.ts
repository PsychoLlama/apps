import type { ColorScale } from './color-palette';

export const mintLight: ColorScale = {
  1: '#f9fefd',
  2: '#f2fbf9',
  3: '#ddf9f2',
  4: '#c8f4e9',
  5: '#b3ecde',
  6: '#9ce0d0',
  7: '#7ecfbd',
  8: '#4cbba5',
  9: '#86ead4',
  10: '#7de0cb',
  11: '#027864',
  12: '#16433c',
};

export const mintLightAlpha: ColorScale = {
  1: '#00d5aa06',
  2: '#00b18a0d',
  3: '#00d29e22',
  4: '#00cc9937',
  5: '#00c0914c',
  6: '#00b08663',
  7: '#00a17d81',
  8: '#009e7fb3',
  9: '#00d3a579',
  10: '#00c39982',
  11: '#007763fd',
  12: '#00312ae9',
};

export const mintDark: ColorScale = {
  1: '#0e1515',
  2: '#0f1b1b',
  3: '#092c2b',
  4: '#003a38',
  5: '#004744',
  6: '#105650',
  7: '#1e685f',
  8: '#277f70',
  9: '#86ead4',
  10: '#a8f5e5',
  11: '#58d5ba',
  12: '#c4f5e1',
};

export const mintDarkAlpha: ColorScale = {
  1: '#00dede05',
  2: '#00f9f90b',
  3: '#00fff61d',
  4: '#00fff42c',
  5: '#00fff23a',
  6: '#0effeb4a',
  7: '#34fde55e',
  8: '#41ffdf76',
  9: '#92ffe7e9',
  10: '#aefeedf5',
  11: '#67ffded2',
  12: '#cbfee9f5',
};

/** Legible text color paired with `mint[9]`. Mode-invariant. */
export const mintContrast = '#1a211e';

/** Translucent panel-ish background, distinct from `mint[2]`. Light mode. */
export const mintLightSurface = '#effaf8cc';

/** Translucent panel-ish background, distinct from `mint[2]`. Dark mode. */
export const mintDarkSurface = '#15272780';
