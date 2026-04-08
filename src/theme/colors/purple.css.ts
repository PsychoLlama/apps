import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const purpleVars = createGlobalThemeContract(
  colorContractShape('purple'),
);

const lightValues = {
  1: '#fefcfe',
  2: '#fbf7fe',
  3: '#f7edfe',
  4: '#f2e2fc',
  5: '#ead5f9',
  6: '#e0c4f4',
  7: '#d1afec',
  8: '#be93e4',
  9: '#8e4ec6',
  10: '#8347b9',
  11: '#8145b5',
  12: '#402060',
  a1: '#aa00aa03',
  a2: '#8000e008',
  a3: '#8e00f112',
  a4: '#8d00e51d',
  a5: '#8000db2a',
  a6: '#7a01d03b',
  a7: '#6d00c350',
  a8: '#6600c06c',
  a9: '#5c00adb1',
  a10: '#53009eb8',
  a11: '#52009aba',
  a12: '#250049df',
  contrast: 'white',
  surface: '#faf5fecc',
  indicator: '#8e4ec6',
  track: '#8e4ec6',
};

const darkValues = {
  1: '#18111b',
  2: '#1e1523',
  3: '#301c3b',
  4: '#3d224e',
  5: '#48295c',
  6: '#54346b',
  7: '#664282',
  8: '#8457aa',
  9: '#8e4ec6',
  10: '#9a5cd0',
  11: '#d19dff',
  12: '#ecd9fa',
  a1: '#b412f90b',
  a2: '#b744f714',
  a3: '#c150ff2d',
  a4: '#bb53fd42',
  a5: '#be5cfd51',
  a6: '#c16dfd61',
  a7: '#c378fd7a',
  a8: '#c47effa4',
  a9: '#b661ffc2',
  a10: '#bc6fffcd',
  a11: '#d19dff',
  a12: '#f1ddfffa',
  contrast: 'white',
  surface: '#2b173580',
  indicator: '#8e4ec6',
  track: '#8e4ec6',
};

createGlobalTheme(':root, [data-theme="light"]', purpleVars, lightValues);
createGlobalTheme('[data-theme="dark"]', purpleVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(purpleVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="purple"]', {
  vars: assignVars(vars.accent, {
    1: purpleVars[1],
    a1: purpleVars.a1,
    2: purpleVars[2],
    a2: purpleVars.a2,
    3: purpleVars[3],
    a3: purpleVars.a3,
    4: purpleVars[4],
    a4: purpleVars.a4,
    5: purpleVars[5],
    a5: purpleVars.a5,
    6: purpleVars[6],
    a6: purpleVars.a6,
    7: purpleVars[7],
    a7: purpleVars.a7,
    8: purpleVars[8],
    a8: purpleVars.a8,
    9: purpleVars[9],
    a9: purpleVars.a9,
    10: purpleVars[10],
    a10: purpleVars.a10,
    11: purpleVars[11],
    a11: purpleVars.a11,
    12: purpleVars[12],
    a12: purpleVars.a12,
    contrast: purpleVars.contrast,
    surface: purpleVars.surface,
    indicator: purpleVars.indicator,
    track: purpleVars.track,
  }),
});
