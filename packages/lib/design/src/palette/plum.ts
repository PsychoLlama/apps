import type { ColorScale } from './color-palette';

export const plumLight: ColorScale = {
  1: '#fefcff',
  2: '#fdf7fd',
  3: '#fbebfb',
  4: '#f7def8',
  5: '#f2d1f3',
  6: '#e9c2ec',
  7: '#deade3',
  8: '#cf91d8',
  9: '#ab4aba',
  10: '#a144af',
  11: '#953ea3',
  12: '#53195d',
};

export const plumLightAlpha: ColorScale = {
  1: '#aa00ff03',
  2: '#c000c008',
  3: '#cc00cc14',
  4: '#c200c921',
  5: '#b700bd2e',
  6: '#a400b03d',
  7: '#9900a852',
  8: '#9000a56e',
  9: '#89009eb5',
  10: '#7f0092bb',
  11: '#730086c1',
  12: '#40004be6',
};

export const plumDark: ColorScale = {
  1: '#181118',
  2: '#201320',
  3: '#351a35',
  4: '#451d47',
  5: '#512454',
  6: '#5e3061',
  7: '#734079',
  8: '#92549c',
  9: '#ab4aba',
  10: '#b658c4',
  11: '#e796f3',
  12: '#f4d4f4',
};

export const plumDarkAlpha: ColorScale = {
  1: '#f112f108',
  2: '#f22ff211',
  3: '#fd4cfd27',
  4: '#f646ff3a',
  5: '#f455ff48',
  6: '#f66dff56',
  7: '#f07cfd70',
  8: '#ee84ff95',
  9: '#e961feb6',
  10: '#ed70ffc0',
  11: '#f19cfef3',
  12: '#feddfef4',
};

/** Legible text color paired with `plum[9]`. Mode-invariant. */
export const plumContrast = 'white';

/** Translucent panel-ish background, distinct from `plum[2]`. Light mode. */
export const plumLightSurface = '#fdf5fdcc';

/** Translucent panel-ish background, distinct from `plum[2]`. Dark mode. */
export const plumDarkSurface = '#2f152f80';
