import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const grassVars = createGlobalThemeContract(colorContractShape('grass'));

const lightValues = {
  1: '#fbfefb',
  2: '#f5fbf5',
  3: '#e9f6e9',
  4: '#daf1db',
  5: '#c9e8ca',
  6: '#b2ddb5',
  7: '#94ce9a',
  8: '#65ba74',
  9: '#46a758',
  10: '#3e9b4f',
  11: '#2a7e3b',
  12: '#203c25',
  a1: '#00c00004',
  a2: '#0099000a',
  a3: '#00970016',
  a4: '#009f0725',
  a5: '#00930536',
  a6: '#008f0a4d',
  a7: '#018b0f6b',
  a8: '#008d199a',
  a9: '#008619b9',
  a10: '#007b17c1',
  a11: '#006514d5',
  a12: '#002006df',
  contrast: 'white',
  surface: '#f3faf3cc',
  indicator: '#46a758',
  track: '#46a758',
};

const darkValues = {
  1: '#0e1511',
  2: '#141a15',
  3: '#1b2a1e',
  4: '#1d3a24',
  5: '#25482d',
  6: '#2d5736',
  7: '#366740',
  8: '#3e7949',
  9: '#46a758',
  10: '#53b365',
  11: '#71d083',
  12: '#c2f0c2',
  a1: '#00de1205',
  a2: '#5ef7780a',
  a3: '#70fe8c1b',
  a4: '#57ff802c',
  a5: '#68ff8b3b',
  a6: '#71ff8f4b',
  a7: '#77fd925d',
  a8: '#77fd9070',
  a9: '#65ff82a1',
  a10: '#72ff8dae',
  a11: '#89ff9fcd',
  a12: '#ceffceef',
  contrast: 'white',
  surface: '#19231b80',
  indicator: '#46a758',
  track: '#46a758',
};

createGlobalTheme(':root, [data-theme="light"]', grassVars, lightValues);
createGlobalTheme('[data-theme="dark"]', grassVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(grassVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="grass"]', {
  vars: assignVars(vars.accent, {
    1: grassVars[1],
    a1: grassVars.a1,
    2: grassVars[2],
    a2: grassVars.a2,
    3: grassVars[3],
    a3: grassVars.a3,
    4: grassVars[4],
    a4: grassVars.a4,
    5: grassVars[5],
    a5: grassVars.a5,
    6: grassVars[6],
    a6: grassVars.a6,
    7: grassVars[7],
    a7: grassVars.a7,
    8: grassVars[8],
    a8: grassVars.a8,
    9: grassVars[9],
    a9: grassVars.a9,
    10: grassVars[10],
    a10: grassVars.a10,
    11: grassVars[11],
    a11: grassVars.a11,
    12: grassVars[12],
    a12: grassVars.a12,
    contrast: grassVars.contrast,
    surface: grassVars.surface,
    indicator: grassVars.indicator,
    track: grassVars.track,
  }),
});
