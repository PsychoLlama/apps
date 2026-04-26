import type { ColorScale } from './color-palette';

export const skyLight: ColorScale = {
  1: '#f9feff',
  2: '#f1fafd',
  3: '#e1f6fd',
  4: '#d1f0fa',
  5: '#bee7f5',
  6: '#a9daed',
  7: '#8dcae3',
  8: '#60b3d7',
  9: '#7ce2fe',
  10: '#74daf8',
  11: '#00749e',
  12: '#1d3e56',
};

export const skyLightAlpha: ColorScale = {
  1: '#00d5ff06',
  2: '#00a4db0e',
  3: '#00b3ee1e',
  4: '#00ace42e',
  5: '#00a1d841',
  6: '#0092ca56',
  7: '#0089c172',
  8: '#0085bf9f',
  9: '#00c7fe83',
  10: '#00bcf38b',
  11: '#00749e',
  12: '#002540e2',
};

export const skyDark: ColorScale = {
  1: '#0d141f',
  2: '#111a27',
  3: '#112840',
  4: '#113555',
  5: '#154467',
  6: '#1b537b',
  7: '#1f6692',
  8: '#197cae',
  9: '#7ce2fe',
  10: '#a8eeff',
  11: '#75c7f0',
  12: '#c2f3ff',
};

export const skyDarkAlpha: ColorScale = {
  1: '#0044ff0f',
  2: '#1171fb18',
  3: '#1184fc33',
  4: '#128fff49',
  5: '#1c9dfd5d',
  6: '#28a5ff72',
  7: '#2badfe8b',
  8: '#1db2fea9',
  9: '#7ce3fffe',
  10: '#a8eeff',
  11: '#7cd3ffef',
  12: '#c2f3ff',
};

/** Legible text color paired with `sky[9]`. Mode-invariant. */
export const skyContrast = '#1c2024';

/** Translucent panel-ish background, distinct from `sky[2]`. Light mode. */
export const skyLightSurface = '#eef9fdcc';

/** Translucent panel-ish background, distinct from `sky[2]`. Dark mode. */
export const skyDarkSurface = '#13233b80';
