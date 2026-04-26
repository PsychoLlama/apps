import type { ColorScale } from './color-palette';

export const crimsonLight: ColorScale = {
  1: '#fffcfd',
  2: '#fef7f9',
  3: '#ffe9f0',
  4: '#fedce7',
  5: '#facedd',
  6: '#f3bed1',
  7: '#eaacc3',
  8: '#e093b2',
  9: '#e93d82',
  10: '#df3478',
  11: '#cb1d63',
  12: '#621639',
};

export const crimsonLightAlpha: ColorScale = {
  1: '#ff005503',
  2: '#e0004008',
  3: '#ff005216',
  4: '#f8005123',
  5: '#e5004f31',
  6: '#d0004b41',
  7: '#bf004753',
  8: '#b6004a6c',
  9: '#e2005bc2',
  10: '#d70056cb',
  11: '#c4004fe2',
  12: '#530026e9',
};

export const crimsonDark: ColorScale = {
  1: '#191114',
  2: '#201318',
  3: '#381525',
  4: '#4d122f',
  5: '#5c1839',
  6: '#6d2545',
  7: '#873356',
  8: '#b0436e',
  9: '#e93d82',
  10: '#ee518a',
  11: '#ff92ad',
  12: '#fdd3e8',
};

export const crimsonDarkAlpha: ColorScale = {
  1: '#f4126709',
  2: '#f22f7a11',
  3: '#fe2a8b2a',
  4: '#fd158741',
  5: '#fd278f51',
  6: '#fe459763',
  7: '#fd559b7f',
  8: '#fe5b9bab',
  9: '#fe418de8',
  10: '#ff5693ed',
  11: '#ff92ad',
  12: '#ffd5eafd',
};

/** Legible text color paired with `crimson[9]`. Mode-invariant. */
export const crimsonContrast = 'white';

/** Translucent panel-ish background, distinct from `crimson[2]`. Light mode. */
export const crimsonLightSurface = '#fef5f8cc';

/** Translucent panel-ish background, distinct from `crimson[2]`. Dark mode. */
export const crimsonDarkSurface = '#2f151f80';
