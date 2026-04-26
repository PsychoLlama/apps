import type { ColorScale } from './color-palette';

export const mauveLight: ColorScale = {
  1: '#fdfcfd',
  2: '#faf9fb',
  3: '#f2eff3',
  4: '#eae7ec',
  5: '#e3dfe6',
  6: '#dbd8e0',
  7: '#d0cdd7',
  8: '#bcbac7',
  9: '#8e8c99',
  10: '#84828e',
  11: '#65636d',
  12: '#211f26',
};

export const mauveLightAlpha: ColorScale = {
  1: '#55005503',
  2: '#2b005506',
  3: '#30004010',
  4: '#20003618',
  5: '#20003820',
  6: '#14003527',
  7: '#10003332',
  8: '#08003145',
  9: '#05001d73',
  10: '#0500197d',
  11: '#0400119c',
  12: '#020008e0',
};

export const mauveDark: ColorScale = {
  1: '#121113',
  2: '#1a191b',
  3: '#232225',
  4: '#2b292d',
  5: '#323035',
  6: '#3c393f',
  7: '#49474e',
  8: '#625f69',
  9: '#6f6d78',
  10: '#7c7a85',
  11: '#b5b2bc',
  12: '#eeeef0',
};

export const mauveDarkAlpha: ColorScale = {
  1: '#00000000',
  2: '#f5f4f609',
  3: '#ebeaf814',
  4: '#eee5f81d',
  5: '#efe6fe25',
  6: '#f1e6fd30',
  7: '#eee9ff40',
  8: '#eee7ff5d',
  9: '#eae6fd6e',
  10: '#ece9fd7c',
  11: '#f5f1ffb7',
  12: '#fdfdffef',
};

/** Legible text color paired with `mauve[9]`. Mode-invariant. */
export const mauveContrast = 'white';

/** Translucent panel-ish background, distinct from `mauve[2]`. Light mode. */
export const mauveLightSurface = '#ffffffcc';

/** Translucent panel-ish background, distinct from `mauve[2]`. Dark mode. */
export const mauveDarkSurface = '#22212380';
