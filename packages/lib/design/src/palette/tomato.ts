import type { ColorScale } from './color-palette';

export const tomatoLight: ColorScale = {
  1: '#fffcfc',
  2: '#fff8f7',
  3: '#feebe7',
  4: '#ffdcd3',
  5: '#ffcdc2',
  6: '#fdbdaf',
  7: '#f5a898',
  8: '#ec8e7b',
  9: '#e54d2e',
  10: '#dd4425',
  11: '#d13415',
  12: '#5c271f',
};

export const tomatoLightAlpha: ColorScale = {
  1: '#ff000003',
  2: '#ff200008',
  3: '#f52b0018',
  4: '#ff35002c',
  5: '#ff2e003d',
  6: '#f92d0050',
  7: '#e7280067',
  8: '#db250084',
  9: '#df2600d1',
  10: '#d72400da',
  11: '#cd2200ea',
  12: '#460900e0',
};

export const tomatoDark: ColorScale = {
  1: '#181111',
  2: '#1f1513',
  3: '#391714',
  4: '#4e1511',
  5: '#5e1c16',
  6: '#6e2920',
  7: '#853a2d',
  8: '#ac4d39',
  9: '#e54d2e',
  10: '#ec6142',
  11: '#ff977d',
  12: '#fbd3cb',
};

export const tomatoDarkAlpha: ColorScale = {
  1: '#f1121208',
  2: '#ff55330f',
  3: '#ff35232b',
  4: '#fd201142',
  5: '#fe332153',
  6: '#ff4f3864',
  7: '#fd644a7d',
  8: '#fe6d4ea7',
  9: '#fe5431e4',
  10: '#ff6847eb',
  11: '#ff977d',
  12: '#ffd6cefb',
};

/** Legible text color paired with `tomato[9]`. Mode-invariant. */
export const tomatoContrast = 'white';

/** Translucent panel-ish background, distinct from `tomato[2]`. Light mode. */
export const tomatoLightSurface = '#fff6f5cc';

/** Translucent panel-ish background, distinct from `tomato[2]`. Dark mode. */
export const tomatoDarkSurface = '#2d191580';
