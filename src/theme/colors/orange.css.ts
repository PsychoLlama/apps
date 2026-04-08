import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const orangeVars = createGlobalThemeContract(
  colorContractShape('orange'),
);

const lightValues = {
  1: '#fefcfb',
  2: '#fff7ed',
  3: '#ffefd6',
  4: '#ffdfb5',
  5: '#ffd19a',
  6: '#ffc182',
  7: '#f5ae73',
  8: '#ec9455',
  9: '#f76b15',
  10: '#ef5f00',
  11: '#cc4e00',
  12: '#582d1d',
  a1: '#c0400004',
  a2: '#ff8e0012',
  a3: '#ff9c0029',
  a4: '#ff91014a',
  a5: '#ff8b0065',
  a6: '#ff81007d',
  a7: '#ed6c008c',
  a8: '#e35f00aa',
  a9: '#f65e00ea',
  a10: '#ef5f00',
  a11: '#cc4e00',
  a12: '#431200e2',
  contrast: 'white',
  surface: '#fff5e9cc',
  indicator: '#f76b15',
  track: '#f76b15',
};

const darkValues = {
  1: '#17120e',
  2: '#1e160f',
  3: '#331e0b',
  4: '#462100',
  5: '#562800',
  6: '#66350c',
  7: '#7e451d',
  8: '#a35829',
  9: '#f76b15',
  10: '#ff801f',
  11: '#ffa057',
  12: '#ffe0c2',
  a1: '#ec360007',
  a2: '#fe6d000e',
  a3: '#fb6a0025',
  a4: '#ff590039',
  a5: '#ff61004a',
  a6: '#fd75045c',
  a7: '#ff832c75',
  a8: '#fe84389d',
  a9: '#fe6d15f7',
  a10: '#ff801f',
  a11: '#ffa057',
  a12: '#ffe0c2',
  contrast: 'white',
  surface: '#271d1380',
  indicator: '#f76b15',
  track: '#f76b15',
};

createGlobalTheme(':root, [data-theme="light"]', orangeVars, lightValues);
createGlobalTheme('[data-theme="dark"]', orangeVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(orangeVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="orange"]', {
  vars: assignVars(vars.accent, {
    1: orangeVars[1],
    a1: orangeVars.a1,
    2: orangeVars[2],
    a2: orangeVars.a2,
    3: orangeVars[3],
    a3: orangeVars.a3,
    4: orangeVars[4],
    a4: orangeVars.a4,
    5: orangeVars[5],
    a5: orangeVars.a5,
    6: orangeVars[6],
    a6: orangeVars.a6,
    7: orangeVars[7],
    a7: orangeVars.a7,
    8: orangeVars[8],
    a8: orangeVars.a8,
    9: orangeVars[9],
    a9: orangeVars.a9,
    10: orangeVars[10],
    a10: orangeVars.a10,
    11: orangeVars[11],
    a11: orangeVars.a11,
    12: orangeVars[12],
    a12: orangeVars.a12,
    contrast: orangeVars.contrast,
    surface: orangeVars.surface,
    indicator: orangeVars.indicator,
    track: orangeVars.track,
  }),
});
