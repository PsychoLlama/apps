import type { ColorScale } from './color-palette';

export const indigoLight: ColorScale = {
  1: '#fdfdfe',
  2: '#f7f9ff',
  3: '#edf2fe',
  4: '#e1e9ff',
  5: '#d2deff',
  6: '#c1d0ff',
  7: '#abbdf9',
  8: '#8da4ef',
  9: '#3e63dd',
  10: '#3358d4',
  11: '#3a5bc7',
  12: '#1f2d5c',
};

export const indigoLightAlpha: ColorScale = {
  1: '#00008002',
  2: '#0040ff08',
  3: '#0047f112',
  4: '#0044ff1e',
  5: '#0044ff2d',
  6: '#003eff3e',
  7: '#0037ed54',
  8: '#0034dc72',
  9: '#0031d2c1',
  10: '#002ec9cc',
  11: '#002bb7c5',
  12: '#001046e0',
};

export const indigoDark: ColorScale = {
  1: '#11131f',
  2: '#141726',
  3: '#182449',
  4: '#1d2e62',
  5: '#253974',
  6: '#304384',
  7: '#3a4f97',
  8: '#435db1',
  9: '#3e63dd',
  10: '#5472e4',
  11: '#9eb1ff',
  12: '#d6e1ff',
};

export const indigoDarkAlpha: ColorScale = {
  1: '#1133ff0f',
  2: '#3354fa17',
  3: '#2f62ff3c',
  4: '#3566ff57',
  5: '#4171fd6b',
  6: '#5178fd7c',
  7: '#5a7fff90',
  8: '#5b81feac',
  9: '#4671ffdb',
  10: '#5c7efee3',
  11: '#9eb1ff',
  12: '#d6e1ff',
};

/** Legible text color paired with `indigo[9]`. Mode-invariant. */
export const indigoContrast = 'white';

/** Translucent panel-ish background, distinct from `indigo[2]`. Light mode. */
export const indigoLightSurface = '#f5f8ffcc';

/** Translucent panel-ish background, distinct from `indigo[2]`. Dark mode. */
export const indigoDarkSurface = '#171d3b80';
