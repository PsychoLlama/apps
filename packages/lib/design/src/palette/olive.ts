import type { ColorScale } from './color-palette';

export const oliveLight: ColorScale = {
  1: '#fcfdfc',
  2: '#f8faf8',
  3: '#eff1ef',
  4: '#e7e9e7',
  5: '#dfe2df',
  6: '#d7dad7',
  7: '#cccfcc',
  8: '#b9bcb8',
  9: '#898e87',
  10: '#7f847d',
  11: '#60655f',
  12: '#1d211c',
};

export const oliveLightAlpha: ColorScale = {
  1: '#00550003',
  2: '#00490007',
  3: '#00200010',
  4: '#00160018',
  5: '#00180020',
  6: '#00140028',
  7: '#000f0033',
  8: '#040f0047',
  9: '#050f0078',
  10: '#040e0082',
  11: '#020a00a0',
  12: '#010600e3',
};

export const oliveDark: ColorScale = {
  1: '#111210',
  2: '#181917',
  3: '#212220',
  4: '#282a27',
  5: '#2f312e',
  6: '#383a36',
  7: '#454843',
  8: '#5c625b',
  9: '#687066',
  10: '#767d74',
  11: '#afb5ad',
  12: '#eceeec',
};

export const oliveDarkAlpha: ColorScale = {
  1: '#00000000',
  2: '#f1f2f008',
  3: '#f4f5f312',
  4: '#f3fef21a',
  5: '#f2fbf122',
  6: '#f4faed2c',
  7: '#f2fced3b',
  8: '#edfdeb57',
  9: '#ebfde766',
  10: '#f0fdec74',
  11: '#f6fef4b0',
  12: '#fdfffded',
};

/** Legible text color paired with `olive[9]`. Mode-invariant. */
export const oliveContrast = 'white';

/** Translucent panel-ish background, distinct from `olive[2]`. Light mode. */
export const oliveLightSurface = '#ffffffcc';

/** Translucent panel-ish background, distinct from `olive[2]`. Dark mode. */
export const oliveDarkSurface = '#1f201e80';
