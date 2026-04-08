import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const greenVars = createGlobalThemeContract(colorContractShape('green'));

const lightValues = {
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
  a1: '#00c04004',
  a2: '#00a32f0b',
  a3: '#00a43319',
  a4: '#00a83829',
  a5: '#019c393b',
  a6: '#00963c52',
  a7: '#00914071',
  a8: '#00924ba4',
  a9: '#008f4acf',
  a10: '#008647d4',
  a11: '#00713fde',
  a12: '#002616e6',
  contrast: 'white',
  surface: '#f1faf4cc',
  indicator: '#30a46c',
  track: '#30a46c',
};

const darkValues = {
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
  a1: '#00de4505',
  a2: '#29f99d0b',
  a3: '#22ff991e',
  a4: '#11ff992d',
  a5: '#2bffa23c',
  a6: '#44ffaa4b',
  a7: '#50fdac5e',
  a8: '#54ffad73',
  a9: '#44ffa49e',
  a10: '#43fea4ab',
  a11: '#46fea5d4',
  a12: '#bbffd7f0',
  contrast: 'white',
  surface: '#15251d80',
  indicator: '#30a46c',
  track: '#30a46c',
};

createGlobalTheme(':root, [data-theme="light"]', greenVars, lightValues);
createGlobalTheme('[data-theme="dark"]', greenVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(greenVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="green"]', {
  vars: assignVars(vars.accent, {
    1: greenVars[1],
    a1: greenVars.a1,
    2: greenVars[2],
    a2: greenVars.a2,
    3: greenVars[3],
    a3: greenVars.a3,
    4: greenVars[4],
    a4: greenVars.a4,
    5: greenVars[5],
    a5: greenVars.a5,
    6: greenVars[6],
    a6: greenVars.a6,
    7: greenVars[7],
    a7: greenVars.a7,
    8: greenVars[8],
    a8: greenVars.a8,
    9: greenVars[9],
    a9: greenVars.a9,
    10: greenVars[10],
    a10: greenVars.a10,
    11: greenVars[11],
    a11: greenVars.a11,
    12: greenVars[12],
    a12: greenVars.a12,
    contrast: greenVars.contrast,
    surface: greenVars.surface,
    indicator: greenVars.indicator,
    track: greenVars.track,
  }),
});
