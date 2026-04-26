import type { ColorScale } from './color-palette';

export const violetLight: ColorScale = {
  1: '#fdfcfe',
  2: '#faf8ff',
  3: '#f4f0fe',
  4: '#ebe4ff',
  5: '#e1d9ff',
  6: '#d4cafe',
  7: '#c2b5f5',
  8: '#aa99ec',
  9: '#6e56cf',
  10: '#654dc4',
  11: '#6550b9',
  12: '#2f265f',
};

export const violetLightAlpha: ColorScale = {
  1: '#5500aa03',
  2: '#4900ff07',
  3: '#4400ee0f',
  4: '#4300ff1b',
  5: '#3600ff26',
  6: '#3100fb35',
  7: '#2d01dd4a',
  8: '#2b00d066',
  9: '#2400b7a9',
  10: '#2300abb2',
  11: '#1f0099af',
  12: '#0b0043d9',
};

export const violetDark: ColorScale = {
  1: '#14121f',
  2: '#1b1525',
  3: '#291f43',
  4: '#33255b',
  5: '#3c2e69',
  6: '#473876',
  7: '#56468b',
  8: '#6958ad',
  9: '#6e56cf',
  10: '#7d66d9',
  11: '#baa7ff',
  12: '#e2ddfe',
};

export const violetDarkAlpha: ColorScale = {
  1: '#4422ff0f',
  2: '#853ff916',
  3: '#8354fe36',
  4: '#7d51fd50',
  5: '#845ffd5f',
  6: '#8f6cfd6d',
  7: '#9879ff83',
  8: '#977dfea8',
  9: '#8668ffcc',
  10: '#9176fed7',
  11: '#baa7ff',
  12: '#e3defffe',
};

/** Legible text color paired with `violet[9]`. Mode-invariant. */
export const violetContrast = 'white';

/** Translucent panel-ish background, distinct from `violet[2]`. Light mode. */
export const violetLightSurface = '#f9f6ffcc';

/** Translucent panel-ish background, distinct from `violet[2]`. Dark mode. */
export const violetDarkSurface = '#25193980';
