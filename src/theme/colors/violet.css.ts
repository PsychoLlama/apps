import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const violetVars = createGlobalThemeContract(
  colorContractShape('violet'),
);

const lightValues = {
  1: '#fdfcfe',
  2: '#faf8ff',
  3: '#f4f0fe',
  4: '#ebe4ff',
  5: '#e1d9ff',
  6: '#d4cafe',
  7: '#c2b5f5',
  8: '#aa99ec',
  9: '#6e56cf',
  10: '#654dc4',
  11: '#6550b9',
  12: '#2f265f',
  a1: '#5500aa03',
  a2: '#4900ff07',
  a3: '#4400ee0f',
  a4: '#4300ff1b',
  a5: '#3600ff26',
  a6: '#3100fb35',
  a7: '#2d01dd4a',
  a8: '#2b00d066',
  a9: '#2400b7a9',
  a10: '#2300abb2',
  a11: '#1f0099af',
  a12: '#0b0043d9',
  contrast: 'white',
  surface: '#f9f6ffcc',
  indicator: '#6e56cf',
  track: '#6e56cf',
};

const darkValues = {
  1: '#14121f',
  2: '#1b1525',
  3: '#291f43',
  4: '#33255b',
  5: '#3c2e69',
  6: '#473876',
  7: '#56468b',
  8: '#6958ad',
  9: '#6e56cf',
  10: '#7d66d9',
  11: '#baa7ff',
  12: '#e2ddfe',
  a1: '#4422ff0f',
  a2: '#853ff916',
  a3: '#8354fe36',
  a4: '#7d51fd50',
  a5: '#845ffd5f',
  a6: '#8f6cfd6d',
  a7: '#9879ff83',
  a8: '#977dfea8',
  a9: '#8668ffcc',
  a10: '#9176fed7',
  a11: '#baa7ff',
  a12: '#e3defffe',
  contrast: 'white',
  surface: '#25193980',
  indicator: '#6e56cf',
  track: '#6e56cf',
};

createGlobalTheme(':root, [data-theme="light"]', violetVars, lightValues);
createGlobalTheme('[data-theme="dark"]', violetVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(violetVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="violet"]', {
  vars: assignVars(vars.accent, {
    1: violetVars[1],
    a1: violetVars.a1,
    2: violetVars[2],
    a2: violetVars.a2,
    3: violetVars[3],
    a3: violetVars.a3,
    4: violetVars[4],
    a4: violetVars.a4,
    5: violetVars[5],
    a5: violetVars.a5,
    6: violetVars[6],
    a6: violetVars.a6,
    7: violetVars[7],
    a7: violetVars.a7,
    8: violetVars[8],
    a8: violetVars.a8,
    9: violetVars[9],
    a9: violetVars.a9,
    10: violetVars[10],
    a10: violetVars.a10,
    11: violetVars[11],
    a11: violetVars.a11,
    12: violetVars[12],
    a12: violetVars.a12,
    contrast: violetVars.contrast,
    surface: violetVars.surface,
    indicator: violetVars.indicator,
    track: violetVars.track,
  }),
});
