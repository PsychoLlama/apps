import type { ColorScale } from './color-palette';

export const grassLight: ColorScale = {
  1: '#fbfefb',
  2: '#f5fbf5',
  3: '#e9f6e9',
  4: '#daf1db',
  5: '#c9e8ca',
  6: '#b2ddb5',
  7: '#94ce9a',
  8: '#65ba74',
  9: '#46a758',
  10: '#3e9b4f',
  11: '#2a7e3b',
  12: '#203c25',
};

export const grassLightAlpha: ColorScale = {
  1: '#00c00004',
  2: '#0099000a',
  3: '#00970016',
  4: '#009f0725',
  5: '#00930536',
  6: '#008f0a4d',
  7: '#018b0f6b',
  8: '#008d199a',
  9: '#008619b9',
  10: '#007b17c1',
  11: '#006514d5',
  12: '#002006df',
};

export const grassDark: ColorScale = {
  1: '#0e1511',
  2: '#141a15',
  3: '#1b2a1e',
  4: '#1d3a24',
  5: '#25482d',
  6: '#2d5736',
  7: '#366740',
  8: '#3e7949',
  9: '#46a758',
  10: '#53b365',
  11: '#71d083',
  12: '#c2f0c2',
};

export const grassDarkAlpha: ColorScale = {
  1: '#00de1205',
  2: '#5ef7780a',
  3: '#70fe8c1b',
  4: '#57ff802c',
  5: '#68ff8b3b',
  6: '#71ff8f4b',
  7: '#77fd925d',
  8: '#77fd9070',
  9: '#65ff82a1',
  10: '#72ff8dae',
  11: '#89ff9fcd',
  12: '#ceffceef',
};

/** Legible text color paired with `grass[9]`. Mode-invariant. */
export const grassContrast = 'white';

/** Translucent panel-ish background, distinct from `grass[2]`. Light mode. */
export const grassLightSurface = '#f3faf3cc';

/** Translucent panel-ish background, distinct from `grass[2]`. Dark mode. */
export const grassDarkSurface = '#19231b80';
