import type { ColorScale } from './color-palette';

export const blueLight: ColorScale = {
  1: '#fbfdff',
  2: '#f4faff',
  3: '#e6f4fe',
  4: '#d5efff',
  5: '#c2e5ff',
  6: '#acd8fc',
  7: '#8ec8f6',
  8: '#5eb1ef',
  9: '#0090ff',
  10: '#0588f0',
  11: '#0d74ce',
  12: '#113264',
};

export const blueLightAlpha: ColorScale = {
  1: '#0080ff04',
  2: '#008cff0b',
  3: '#008ff519',
  4: '#009eff2a',
  5: '#0093ff3d',
  6: '#0088f653',
  7: '#0083eb71',
  8: '#0084e6a1',
  9: '#0090ff',
  10: '#0086f0fa',
  11: '#006dcbf2',
  12: '#002359ee',
};

export const blueDark: ColorScale = {
  1: '#0d1520',
  2: '#111927',
  3: '#0d2847',
  4: '#003362',
  5: '#004074',
  6: '#104d87',
  7: '#205d9e',
  8: '#2870bd',
  9: '#0090ff',
  10: '#3b9eff',
  11: '#70b8ff',
  12: '#c2e6ff',
};

export const blueDarkAlpha: ColorScale = {
  1: '#004df211',
  2: '#1166fb18',
  3: '#0077ff3a',
  4: '#0075ff57',
  5: '#0081fd6b',
  6: '#0f89fd7f',
  7: '#2a91fe98',
  8: '#3094feb9',
  9: '#0090ff',
  10: '#3b9eff',
  11: '#70b8ff',
  12: '#c2e6ff',
};

/** Legible text color paired with `blue[9]`. Mode-invariant. */
export const blueContrast = 'white';

/** Translucent panel-ish background, distinct from `blue[2]`. Light mode. */
export const blueLightSurface = '#f1f9ffcc';

/** Translucent panel-ish background, distinct from `blue[2]`. Dark mode. */
export const blueDarkSurface = '#11213d80';
