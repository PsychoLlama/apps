import type { ColorScale } from './color-palette';

export const tealLight: ColorScale = {
  1: '#fafefd',
  2: '#f3fbf9',
  3: '#e0f8f3',
  4: '#ccf3ea',
  5: '#b8eae0',
  6: '#a1ded2',
  7: '#83cdc1',
  8: '#53b9ab',
  9: '#12a594',
  10: '#0d9b8a',
  11: '#008573',
  12: '#0d3d38',
};

export const tealLightAlpha: ColorScale = {
  1: '#00cc9905',
  2: '#00aa800c',
  3: '#00c69d1f',
  4: '#00c39633',
  5: '#00b49047',
  6: '#00a6855e',
  7: '#0099807c',
  8: '#009783ac',
  9: '#009e8ced',
  10: '#009684f2',
  11: '#008573',
  12: '#00332df2',
};

export const tealDark: ColorScale = {
  1: '#0d1514',
  2: '#111c1b',
  3: '#0d2d2a',
  4: '#023b37',
  5: '#084843',
  6: '#145750',
  7: '#1c6961',
  8: '#207e73',
  9: '#12a594',
  10: '#0eb39e',
  11: '#0bd8b6',
  12: '#adf0dd',
};

export const tealDarkAlpha: ColorScale = {
  1: '#00deab05',
  2: '#12fbe60c',
  3: '#00ffe61e',
  4: '#00ffe92d',
  5: '#00ffea3b',
  6: '#1cffe84b',
  7: '#2efde85f',
  8: '#32ffe775',
  9: '#13ffe49f',
  10: '#0dffe0ae',
  11: '#0afed5d6',
  12: '#b8ffebef',
};

/** Legible text color paired with `teal[9]`. Mode-invariant. */
export const tealContrast = 'white';

/** Translucent panel-ish background, distinct from `teal[2]`. Light mode. */
export const tealLightSurface = '#f0faf8cc';

/** Translucent panel-ish background, distinct from `teal[2]`. Dark mode. */
export const tealDarkSurface = '#13272580';
