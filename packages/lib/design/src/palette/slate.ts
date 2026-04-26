import type { ColorScale } from './color-palette';

export const slateLight: ColorScale = {
  1: '#fcfcfd',
  2: '#f9f9fb',
  3: '#f0f0f3',
  4: '#e8e8ec',
  5: '#e0e1e6',
  6: '#d9d9e0',
  7: '#cdced6',
  8: '#b9bbc6',
  9: '#8b8d98',
  10: '#80838d',
  11: '#60646c',
  12: '#1c2024',
};

export const slateLightAlpha: ColorScale = {
  1: '#00005503',
  2: '#00005506',
  3: '#0000330f',
  4: '#00002d17',
  5: '#0009321f',
  6: '#00002f26',
  7: '#00062e32',
  8: '#00083046',
  9: '#00051d74',
  10: '#00071b7f',
  11: '#0007149f',
  12: '#000509e3',
};

export const slateDark: ColorScale = {
  1: '#111113',
  2: '#18191b',
  3: '#212225',
  4: '#272a2d',
  5: '#2e3135',
  6: '#363a3f',
  7: '#43484e',
  8: '#5a6169',
  9: '#696e77',
  10: '#777b84',
  11: '#b0b4ba',
  12: '#edeef0',
};

export const slateDarkAlpha: ColorScale = {
  1: '#00000000',
  2: '#d8f4f609',
  3: '#ddeaf814',
  4: '#d3edf81d',
  5: '#d9edfe25',
  6: '#d6ebfd30',
  7: '#d9edff40',
  8: '#d9edff5d',
  9: '#dfebfd6d',
  10: '#e5edfd7b',
  11: '#f1f7feb5',
  12: '#fcfdffef',
};

/** Legible text color paired with `slate[9]`. Mode-invariant. */
export const slateContrast = 'white';

/** Translucent panel-ish background, distinct from `slate[2]`. Light mode. */
export const slateLightSurface = '#ffffffcc';

/** Translucent panel-ish background, distinct from `slate[2]`. Dark mode. */
export const slateDarkSurface = '#1f212380';
