import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const bronzeVars = createGlobalThemeContract(
  colorContractShape('bronze'),
);

const lightValues = {
  1: '#fdfcfc',
  2: '#fdf7f5',
  3: '#f6edea',
  4: '#efe4df',
  5: '#e7d9d3',
  6: '#dfcdc5',
  7: '#d3bcb3',
  8: '#c2a499',
  9: '#a18072',
  10: '#957468',
  11: '#7d5e54',
  12: '#43302b',
  a1: '#55000003',
  a2: '#cc33000a',
  a3: '#92250015',
  a4: '#80280020',
  a5: '#7423002c',
  a6: '#7324003a',
  a7: '#6c1f004c',
  a8: '#671c0066',
  a9: '#551a008d',
  a10: '#4c150097',
  a11: '#3d0f00ab',
  a12: '#1d0600d4',
  contrast: 'white',
  surface: '#fdf5f3cc',
  indicator: '#a18072',
  track: '#a18072',
};

const darkValues = {
  1: '#141110',
  2: '#1c1917',
  3: '#262220',
  4: '#302a27',
  5: '#3b3330',
  6: '#493e3a',
  7: '#5a4c47',
  8: '#6f5f58',
  9: '#a18072',
  10: '#ae8c7e',
  11: '#d4b3a5',
  12: '#ede0d9',
  a1: '#d1110004',
  a2: '#fbbc910c',
  a3: '#faceb817',
  a4: '#facdb622',
  a5: '#ffd2c12d',
  a6: '#ffd1c03c',
  a7: '#fdd0c04f',
  a8: '#ffd6c565',
  a9: '#fec7b09b',
  a10: '#fecab5a9',
  a11: '#ffd7c6d1',
  a12: '#fff1e9ec',
  contrast: 'white',
  surface: '#27211d80',
  indicator: '#a18072',
  track: '#a18072',
};

createGlobalTheme(':root, [data-theme="light"]', bronzeVars, lightValues);
createGlobalTheme('[data-theme="dark"]', bronzeVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(bronzeVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="bronze"]', {
  vars: assignVars(vars.accent, {
    1: bronzeVars[1],
    a1: bronzeVars.a1,
    2: bronzeVars[2],
    a2: bronzeVars.a2,
    3: bronzeVars[3],
    a3: bronzeVars.a3,
    4: bronzeVars[4],
    a4: bronzeVars.a4,
    5: bronzeVars[5],
    a5: bronzeVars.a5,
    6: bronzeVars[6],
    a6: bronzeVars.a6,
    7: bronzeVars[7],
    a7: bronzeVars.a7,
    8: bronzeVars[8],
    a8: bronzeVars.a8,
    9: bronzeVars[9],
    a9: bronzeVars.a9,
    10: bronzeVars[10],
    a10: bronzeVars.a10,
    11: bronzeVars[11],
    a11: bronzeVars.a11,
    12: bronzeVars[12],
    a12: bronzeVars.a12,
    contrast: bronzeVars.contrast,
    surface: bronzeVars.surface,
    indicator: bronzeVars.indicator,
    track: bronzeVars.track,
  }),
});
