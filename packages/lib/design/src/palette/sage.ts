import type { ColorScale } from './color-palette';

export const sageLight: ColorScale = {
  1: '#fbfdfc',
  2: '#f7f9f8',
  3: '#eef1f0',
  4: '#e6e9e8',
  5: '#dfe2e0',
  6: '#d7dad9',
  7: '#cbcfcd',
  8: '#b8bcba',
  9: '#868e8b',
  10: '#7c8481',
  11: '#5f6563',
  12: '#1a211e',
};

export const sageLightAlpha: ColorScale = {
  1: '#00804004',
  2: '#00402008',
  3: '#002d1e11',
  4: '#001f1519',
  5: '#00180820',
  6: '#00140d28',
  7: '#00140a34',
  8: '#000f0847',
  9: '#00110b79',
  10: '#00100a83',
  11: '#000a07a0',
  12: '#000805e5',
};

export const sageDark: ColorScale = {
  1: '#101211',
  2: '#171918',
  3: '#202221',
  4: '#272a29',
  5: '#2e3130',
  6: '#373b39',
  7: '#444947',
  8: '#5b625f',
  9: '#63706b',
  10: '#717d79',
  11: '#adb5b2',
  12: '#eceeed',
};

export const sageDarkAlpha: ColorScale = {
  1: '#00000000',
  2: '#f0f2f108',
  3: '#f3f5f412',
  4: '#f2fefd1a',
  5: '#f1fbfa22',
  6: '#edfbf42d',
  7: '#edfcf73c',
  8: '#ebfdf657',
  9: '#dffdf266',
  10: '#e5fdf674',
  11: '#f4fefbb0',
  12: '#fdfffeed',
};

/** Legible text color paired with `sage[9]`. Mode-invariant. */
export const sageContrast = 'white';

/** Translucent panel-ish background, distinct from `sage[2]`. Light mode. */
export const sageLightSurface = '#ffffffcc';

/** Translucent panel-ish background, distinct from `sage[2]`. Dark mode. */
export const sageDarkSurface = '#1e201f80';
