import type { ColorScale } from './color-palette';

export const brownLight: ColorScale = {
  1: '#fefdfc',
  2: '#fcf9f6',
  3: '#f6eee7',
  4: '#f0e4d9',
  5: '#ebdaca',
  6: '#e4cdb7',
  7: '#dcbc9f',
  8: '#cea37e',
  9: '#ad7f58',
  10: '#a07553',
  11: '#815e46',
  12: '#3e332e',
};

export const brownLightAlpha: ColorScale = {
  1: '#aa550003',
  2: '#aa550009',
  3: '#a04b0018',
  4: '#9b4a0026',
  5: '#9f4d0035',
  6: '#a04e0048',
  7: '#a34e0060',
  8: '#9f4a0081',
  9: '#823c00a7',
  10: '#723300ac',
  11: '#522100b9',
  12: '#140600d1',
};

export const brownDark: ColorScale = {
  1: '#12110f',
  2: '#1c1816',
  3: '#28211d',
  4: '#322922',
  5: '#3e3128',
  6: '#4d3c2f',
  7: '#614a39',
  8: '#7c5f46',
  9: '#ad7f58',
  10: '#b88c67',
  11: '#dbb594',
  12: '#f2e1ca',
};

export const brownDarkAlpha: ColorScale = {
  1: '#91110002',
  2: '#fba67c0c',
  3: '#fcb58c19',
  4: '#fbbb8a24',
  5: '#fcb88931',
  6: '#fdba8741',
  7: '#ffbb8856',
  8: '#ffbe8773',
  9: '#feb87da8',
  10: '#ffc18cb3',
  11: '#fed1aad9',
  12: '#feecd4f2',
};

/** Legible text color paired with `brown[9]`. Mode-invariant. */
export const brownContrast = 'white';

/** Translucent panel-ish background, distinct from `brown[2]`. Light mode. */
export const brownLightSurface = '#fbf8f4cc';

/** Translucent panel-ish background, distinct from `brown[2]`. Dark mode. */
export const brownDarkSurface = '#271f1b80';
