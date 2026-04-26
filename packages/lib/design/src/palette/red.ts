import type { ColorScale } from './color-palette';

export const redLight: ColorScale = {
  1: '#fffcfc',
  2: '#fff7f7',
  3: '#feebec',
  4: '#ffdbdc',
  5: '#ffcdce',
  6: '#fdbdbe',
  7: '#f4a9aa',
  8: '#eb8e90',
  9: '#e5484d',
  10: '#dc3e42',
  11: '#ce2c31',
  12: '#641723',
};

export const redLightAlpha: ColorScale = {
  1: '#ff000003',
  2: '#ff000008',
  3: '#f3000d14',
  4: '#ff000824',
  5: '#ff000632',
  6: '#f8000442',
  7: '#df000356',
  8: '#d2000571',
  9: '#db0007b7',
  10: '#d10005c1',
  11: '#c40006d3',
  12: '#55000de8',
};

export const redDark: ColorScale = {
  1: '#191111',
  2: '#201314',
  3: '#3b1219',
  4: '#500f1c',
  5: '#611623',
  6: '#72232d',
  7: '#8c333a',
  8: '#b54548',
  9: '#e5484d',
  10: '#ec5d5e',
  11: '#ff9592',
  12: '#ffd1d9',
};

export const redDarkAlpha: ColorScale = {
  1: '#f4121209',
  2: '#f22f3e11',
  3: '#ff173f2d',
  4: '#fe0a3b44',
  5: '#ff204756',
  6: '#ff3e5668',
  7: '#ff536184',
  8: '#ff5d61b0',
  9: '#fe4e54e4',
  10: '#ff6465eb',
  11: '#ff9592',
  12: '#ffd1d9',
};

/** Legible text color paired with `red[9]`. Mode-invariant. */
export const redContrast = 'white';

/** Translucent panel-ish background, distinct from `red[2]`. Light mode. */
export const redLightSurface = '#fff5f5cc';

/** Translucent panel-ish background, distinct from `red[2]`. Dark mode. */
export const redDarkSurface = '#2f151780';
