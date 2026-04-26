import type { ColorScale } from './color-palette';

export const yellowLight: ColorScale = {
  1: '#fdfdf9',
  2: '#fefce9',
  3: '#fffab8',
  4: '#fff394',
  5: '#ffe770',
  6: '#f3d768',
  7: '#e4c767',
  8: '#d5ae39',
  9: '#ffe629',
  10: '#ffdc00',
  11: '#9e6c00',
  12: '#473b1f',
};

export const yellowLightAlpha: ColorScale = {
  1: '#aaaa0006',
  2: '#f4dd0016',
  3: '#ffee0047',
  4: '#ffe3016b',
  5: '#ffd5008f',
  6: '#ebbc0097',
  7: '#d2a10098',
  8: '#c99700c6',
  9: '#ffe100d6',
  10: '#ffdc00',
  11: '#9e6c00',
  12: '#2e2000e0',
};

export const yellowDark: ColorScale = {
  1: '#14120b',
  2: '#1b180f',
  3: '#2d2305',
  4: '#362b00',
  5: '#433500',
  6: '#524202',
  7: '#665417',
  8: '#836a21',
  9: '#ffe629',
  10: '#ffff57',
  11: '#f5e147',
  12: '#f6eeb4',
};

export const yellowDarkAlpha: ColorScale = {
  1: '#d1510004',
  2: '#f9b4000b',
  3: '#ffaa001e',
  4: '#fdb70028',
  5: '#febb0036',
  6: '#fec40046',
  7: '#fdcb225c',
  8: '#fdca327b',
  9: '#ffe629',
  10: '#ffff57',
  11: '#fee949f5',
  12: '#fef6baf6',
};

/** Legible text color paired with `yellow[9]`. Mode-invariant. */
export const yellowContrast = '#21201c';

/** Translucent panel-ish background, distinct from `yellow[2]`. Light mode. */
export const yellowLightSurface = '#fefbe4cc';

/** Translucent panel-ish background, distinct from `yellow[2]`. Dark mode. */
export const yellowDarkSurface = '#231f1380';
