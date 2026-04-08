import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const irisVars = createGlobalThemeContract(colorContractShape('iris'));

const lightValues = {
  1: '#fdfdff',
  2: '#f8f8ff',
  3: '#f0f1fe',
  4: '#e6e7ff',
  5: '#dadcff',
  6: '#cbcdff',
  7: '#b8baf8',
  8: '#9b9ef0',
  9: '#5b5bd6',
  10: '#5151cd',
  11: '#5753c6',
  12: '#272962',
  a1: '#0000ff02',
  a2: '#0000ff07',
  a3: '#0011ee0f',
  a4: '#000bff19',
  a5: '#000eff25',
  a6: '#000aff34',
  a7: '#0008e647',
  a8: '#0008d964',
  a9: '#0000c0a4',
  a10: '#0000b6ae',
  a11: '#0600abac',
  a12: '#000246d8',
  contrast: 'white',
  surface: '#f6f6ffcc',
  indicator: '#5b5bd6',
  track: '#5b5bd6',
};

const darkValues = {
  1: '#13131e',
  2: '#171625',
  3: '#202248',
  4: '#262a65',
  5: '#303374',
  6: '#3d3e82',
  7: '#4a4a95',
  8: '#5958b1',
  9: '#5b5bd6',
  10: '#6e6ade',
  11: '#b1a9ff',
  12: '#e0dffe',
  a1: '#3636fe0e',
  a2: '#564bf916',
  a3: '#525bff3b',
  a4: '#4d58ff5a',
  a5: '#5b62fd6b',
  a6: '#6d6ffd7a',
  a7: '#7777fe8e',
  a8: '#7b7afeac',
  a9: '#6a6afed4',
  a10: '#7d79ffdc',
  a11: '#b1a9ff',
  a12: '#e1e0fffe',
  contrast: 'white',
  surface: '#1d1b3980',
  indicator: '#5b5bd6',
  track: '#5b5bd6',
};

createGlobalTheme(':root, [data-theme="light"]', irisVars, lightValues);
createGlobalTheme('[data-theme="dark"]', irisVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(irisVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="iris"]', {
  vars: assignVars(vars.accent, {
    1: irisVars[1],
    a1: irisVars.a1,
    2: irisVars[2],
    a2: irisVars.a2,
    3: irisVars[3],
    a3: irisVars.a3,
    4: irisVars[4],
    a4: irisVars.a4,
    5: irisVars[5],
    a5: irisVars.a5,
    6: irisVars[6],
    a6: irisVars.a6,
    7: irisVars[7],
    a7: irisVars.a7,
    8: irisVars[8],
    a8: irisVars.a8,
    9: irisVars[9],
    a9: irisVars.a9,
    10: irisVars[10],
    a10: irisVars.a10,
    11: irisVars[11],
    a11: irisVars.a11,
    12: irisVars[12],
    a12: irisVars.a12,
    contrast: irisVars.contrast,
    surface: irisVars.surface,
    indicator: irisVars.indicator,
    track: irisVars.track,
  }),
});
