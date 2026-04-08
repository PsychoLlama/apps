import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const goldVars = createGlobalThemeContract(colorContractShape('gold'));

const lightValues = {
  1: '#fdfdfc',
  2: '#faf9f2',
  3: '#f2f0e7',
  4: '#eae6db',
  5: '#e1dccf',
  6: '#d8d0bf',
  7: '#cbc0aa',
  8: '#b9a88d',
  9: '#978365',
  10: '#8c7a5e',
  11: '#71624b',
  12: '#3b352b',
  a1: '#55550003',
  a2: '#9d8a000d',
  a3: '#75600018',
  a4: '#6b4e0024',
  a5: '#60460030',
  a6: '#64440040',
  a7: '#63420055',
  a8: '#633d0072',
  a9: '#5332009a',
  a10: '#492d00a1',
  a11: '#362100b4',
  a12: '#130c00d4',
  contrast: 'white',
  surface: '#f9f8efcc',
  indicator: '#978365',
  track: '#978365',
};

const darkValues = {
  1: '#121211',
  2: '#1b1a17',
  3: '#24231f',
  4: '#2d2b26',
  5: '#38352e',
  6: '#444039',
  7: '#544f46',
  8: '#696256',
  9: '#978365',
  10: '#a39073',
  11: '#cbb99f',
  12: '#e8e2d9',
  a1: '#91911102',
  a2: '#f9e29d0b',
  a3: '#f8ecbb15',
  a4: '#ffeec41e',
  a5: '#feecc22a',
  a6: '#feebcb37',
  a7: '#ffedcd48',
  a8: '#fdeaca5f',
  a9: '#ffdba690',
  a10: '#fedfb09d',
  a11: '#fee7c6c8',
  a12: '#fef7ede7',
  contrast: 'white',
  surface: '#25231d80',
  indicator: '#978365',
  track: '#978365',
};

createGlobalTheme(':root, [data-theme="light"]', goldVars, lightValues);
createGlobalTheme('[data-theme="dark"]', goldVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(goldVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="gold"]', {
  vars: assignVars(vars.accent, {
    1: goldVars[1],
    a1: goldVars.a1,
    2: goldVars[2],
    a2: goldVars.a2,
    3: goldVars[3],
    a3: goldVars.a3,
    4: goldVars[4],
    a4: goldVars.a4,
    5: goldVars[5],
    a5: goldVars.a5,
    6: goldVars[6],
    a6: goldVars.a6,
    7: goldVars[7],
    a7: goldVars.a7,
    8: goldVars[8],
    a8: goldVars.a8,
    9: goldVars[9],
    a9: goldVars.a9,
    10: goldVars[10],
    a10: goldVars.a10,
    11: goldVars[11],
    a11: goldVars.a11,
    12: goldVars[12],
    a12: goldVars.a12,
    contrast: goldVars.contrast,
    surface: goldVars.surface,
    indicator: goldVars.indicator,
    track: goldVars.track,
  }),
});
