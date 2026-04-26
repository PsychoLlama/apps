import type { ColorScale } from './color-palette';

export const purpleLight: ColorScale = {
  1: '#fefcfe',
  2: '#fbf7fe',
  3: '#f7edfe',
  4: '#f2e2fc',
  5: '#ead5f9',
  6: '#e0c4f4',
  7: '#d1afec',
  8: '#be93e4',
  9: '#8e4ec6',
  10: '#8347b9',
  11: '#8145b5',
  12: '#402060',
};

export const purpleLightAlpha: ColorScale = {
  1: '#aa00aa03',
  2: '#8000e008',
  3: '#8e00f112',
  4: '#8d00e51d',
  5: '#8000db2a',
  6: '#7a01d03b',
  7: '#6d00c350',
  8: '#6600c06c',
  9: '#5c00adb1',
  10: '#53009eb8',
  11: '#52009aba',
  12: '#250049df',
};

export const purpleDark: ColorScale = {
  1: '#18111b',
  2: '#1e1523',
  3: '#301c3b',
  4: '#3d224e',
  5: '#48295c',
  6: '#54346b',
  7: '#664282',
  8: '#8457aa',
  9: '#8e4ec6',
  10: '#9a5cd0',
  11: '#d19dff',
  12: '#ecd9fa',
};

export const purpleDarkAlpha: ColorScale = {
  1: '#b412f90b',
  2: '#b744f714',
  3: '#c150ff2d',
  4: '#bb53fd42',
  5: '#be5cfd51',
  6: '#c16dfd61',
  7: '#c378fd7a',
  8: '#c47effa4',
  9: '#b661ffc2',
  10: '#bc6fffcd',
  11: '#d19dff',
  12: '#f1ddfffa',
};

/** Legible text color paired with `purple[9]`. Mode-invariant. */
export const purpleContrast = 'white';

/** Translucent panel-ish background, distinct from `purple[2]`. Light mode. */
export const purpleLightSurface = '#faf5fecc';

/** Translucent panel-ish background, distinct from `purple[2]`. Dark mode. */
export const purpleDarkSurface = '#2b173580';
