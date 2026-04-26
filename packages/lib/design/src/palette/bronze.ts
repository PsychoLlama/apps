import type { ColorScale } from './color-palette';

export const bronzeLight: ColorScale = {
  1: '#fdfcfc',
  2: '#fdf7f5',
  3: '#f6edea',
  4: '#efe4df',
  5: '#e7d9d3',
  6: '#dfcdc5',
  7: '#d3bcb3',
  8: '#c2a499',
  9: '#a18072',
  10: '#957468',
  11: '#7d5e54',
  12: '#43302b',
};

export const bronzeLightAlpha: ColorScale = {
  1: '#55000003',
  2: '#cc33000a',
  3: '#92250015',
  4: '#80280020',
  5: '#7423002c',
  6: '#7324003a',
  7: '#6c1f004c',
  8: '#671c0066',
  9: '#551a008d',
  10: '#4c150097',
  11: '#3d0f00ab',
  12: '#1d0600d4',
};

export const bronzeDark: ColorScale = {
  1: '#141110',
  2: '#1c1917',
  3: '#262220',
  4: '#302a27',
  5: '#3b3330',
  6: '#493e3a',
  7: '#5a4c47',
  8: '#6f5f58',
  9: '#a18072',
  10: '#ae8c7e',
  11: '#d4b3a5',
  12: '#ede0d9',
};

export const bronzeDarkAlpha: ColorScale = {
  1: '#d1110004',
  2: '#fbbc910c',
  3: '#faceb817',
  4: '#facdb622',
  5: '#ffd2c12d',
  6: '#ffd1c03c',
  7: '#fdd0c04f',
  8: '#ffd6c565',
  9: '#fec7b09b',
  10: '#fecab5a9',
  11: '#ffd7c6d1',
  12: '#fff1e9ec',
};

/** Legible text color paired with `bronze[9]`. Mode-invariant. */
export const bronzeContrast = 'white';

/** Translucent panel-ish background, distinct from `bronze[2]`. Light mode. */
export const bronzeLightSurface = '#fdf5f3cc';

/** Translucent panel-ish background, distinct from `bronze[2]`. Dark mode. */
export const bronzeDarkSurface = '#27211d80';
