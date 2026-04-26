import type { ColorScale } from './color-palette';

export const greenLight: ColorScale = {
  1: '#fbfefc',
  2: '#f4fbf6',
  3: '#e6f6eb',
  4: '#d6f1df',
  5: '#c4e8d1',
  6: '#adddc0',
  7: '#8eceaa',
  8: '#5bb98b',
  9: '#30a46c',
  10: '#2b9a66',
  11: '#218358',
  12: '#193b2d',
};

export const greenLightAlpha: ColorScale = {
  1: '#00c04004',
  2: '#00a32f0b',
  3: '#00a43319',
  4: '#00a83829',
  5: '#019c393b',
  6: '#00963c52',
  7: '#00914071',
  8: '#00924ba4',
  9: '#008f4acf',
  10: '#008647d4',
  11: '#00713fde',
  12: '#002616e6',
};

export const greenDark: ColorScale = {
  1: '#0e1512',
  2: '#121b17',
  3: '#132d21',
  4: '#113b29',
  5: '#174933',
  6: '#20573e',
  7: '#28684a',
  8: '#2f7c57',
  9: '#30a46c',
  10: '#33b074',
  11: '#3dd68c',
  12: '#b1f1cb',
};

export const greenDarkAlpha: ColorScale = {
  1: '#00de4505',
  2: '#29f99d0b',
  3: '#22ff991e',
  4: '#11ff992d',
  5: '#2bffa23c',
  6: '#44ffaa4b',
  7: '#50fdac5e',
  8: '#54ffad73',
  9: '#44ffa49e',
  10: '#43fea4ab',
  11: '#46fea5d4',
  12: '#bbffd7f0',
};

/** Legible text color paired with `green[9]`. Mode-invariant. */
export const greenContrast = 'white';

/** Translucent panel-ish background, distinct from `green[2]`. Light mode. */
export const greenLightSurface = '#f1faf4cc';

/** Translucent panel-ish background, distinct from `green[2]`. Dark mode. */
export const greenDarkSurface = '#15251d80';
