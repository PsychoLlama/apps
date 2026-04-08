import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const blueVars = createGlobalThemeContract(colorContractShape('blue'));

const lightValues = {
  1: '#fbfdff',
  2: '#f4faff',
  3: '#e6f4fe',
  4: '#d5efff',
  5: '#c2e5ff',
  6: '#acd8fc',
  7: '#8ec8f6',
  8: '#5eb1ef',
  9: '#0090ff',
  10: '#0588f0',
  11: '#0d74ce',
  12: '#113264',
  a1: '#0080ff04',
  a2: '#008cff0b',
  a3: '#008ff519',
  a4: '#009eff2a',
  a5: '#0093ff3d',
  a6: '#0088f653',
  a7: '#0083eb71',
  a8: '#0084e6a1',
  a9: '#0090ff',
  a10: '#0086f0fa',
  a11: '#006dcbf2',
  a12: '#002359ee',
  contrast: 'white',
  surface: '#f1f9ffcc',
  indicator: '#0090ff',
  track: '#0090ff',
};

const darkValues = {
  1: '#0d1520',
  2: '#111927',
  3: '#0d2847',
  4: '#003362',
  5: '#004074',
  6: '#104d87',
  7: '#205d9e',
  8: '#2870bd',
  9: '#0090ff',
  10: '#3b9eff',
  11: '#70b8ff',
  12: '#c2e6ff',
  a1: '#004df211',
  a2: '#1166fb18',
  a3: '#0077ff3a',
  a4: '#0075ff57',
  a5: '#0081fd6b',
  a6: '#0f89fd7f',
  a7: '#2a91fe98',
  a8: '#3094feb9',
  a9: '#0090ff',
  a10: '#3b9eff',
  a11: '#70b8ff',
  a12: '#c2e6ff',
  contrast: 'white',
  surface: '#11213d80',
  indicator: '#0090ff',
  track: '#0090ff',
};

createGlobalTheme(':root, [data-theme="light"]', blueVars, lightValues);
createGlobalTheme('[data-theme="dark"]', blueVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(blueVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="blue"]', {
  vars: assignVars(vars.accent, {
    1: blueVars[1],
    a1: blueVars.a1,
    2: blueVars[2],
    a2: blueVars.a2,
    3: blueVars[3],
    a3: blueVars.a3,
    4: blueVars[4],
    a4: blueVars.a4,
    5: blueVars[5],
    a5: blueVars.a5,
    6: blueVars[6],
    a6: blueVars.a6,
    7: blueVars[7],
    a7: blueVars.a7,
    8: blueVars[8],
    a8: blueVars.a8,
    9: blueVars[9],
    a9: blueVars.a9,
    10: blueVars[10],
    a10: blueVars.a10,
    11: blueVars[11],
    a11: blueVars.a11,
    12: blueVars[12],
    a12: blueVars.a12,
    contrast: blueVars.contrast,
    surface: blueVars.surface,
    indicator: blueVars.indicator,
    track: blueVars.track,
  }),
});
