import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const jadeVars = createGlobalThemeContract(colorContractShape('jade'));

const lightValues = {
  1: '#fbfefd',
  2: '#f4fbf7',
  3: '#e6f7ed',
  4: '#d6f1e3',
  5: '#c3e9d7',
  6: '#acdec8',
  7: '#8bceb6',
  8: '#56ba9f',
  9: '#29a383',
  10: '#26997b',
  11: '#208368',
  12: '#1d3b31',
  a1: '#00c08004',
  a2: '#00a3460b',
  a3: '#00ae4819',
  a4: '#00a85129',
  a5: '#00a2553c',
  a6: '#009a5753',
  a7: '#00945f74',
  a8: '#00976ea9',
  a9: '#00916bd6',
  a10: '#008764d9',
  a11: '#007152df',
  a12: '#002217e2',
  contrast: 'white',
  surface: '#f1faf5cc',
  indicator: '#29a383',
  track: '#29a383',
};

const darkValues = {
  1: '#0d1512',
  2: '#121c18',
  3: '#0f2e22',
  4: '#0b3b2c',
  5: '#114837',
  6: '#1b5745',
  7: '#246854',
  8: '#2a7e68',
  9: '#29a383',
  10: '#27b08b',
  11: '#1fd8a4',
  12: '#adf0d4',
  a1: '#00de4505',
  a2: '#27fba60c',
  a3: '#02f99920',
  a4: '#00ffaa2d',
  a5: '#11ffb63b',
  a6: '#34ffc24b',
  a7: '#45fdc75e',
  a8: '#48ffcf75',
  a9: '#38feca9d',
  a10: '#31fec7ab',
  a11: '#21fec0d6',
  a12: '#b8ffe1ef',
  contrast: 'white',
  surface: '#13271f80',
  indicator: '#29a383',
  track: '#29a383',
};

createGlobalTheme(':root, [data-theme="light"]', jadeVars, lightValues);
createGlobalTheme('[data-theme="dark"]', jadeVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(jadeVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="jade"]', {
  vars: assignVars(vars.accent, {
    1: jadeVars[1],
    a1: jadeVars.a1,
    2: jadeVars[2],
    a2: jadeVars.a2,
    3: jadeVars[3],
    a3: jadeVars.a3,
    4: jadeVars[4],
    a4: jadeVars.a4,
    5: jadeVars[5],
    a5: jadeVars.a5,
    6: jadeVars[6],
    a6: jadeVars.a6,
    7: jadeVars[7],
    a7: jadeVars.a7,
    8: jadeVars[8],
    a8: jadeVars.a8,
    9: jadeVars[9],
    a9: jadeVars.a9,
    10: jadeVars[10],
    a10: jadeVars.a10,
    11: jadeVars[11],
    a11: jadeVars.a11,
    12: jadeVars[12],
    a12: jadeVars.a12,
    contrast: jadeVars.contrast,
    surface: jadeVars.surface,
    indicator: jadeVars.indicator,
    track: jadeVars.track,
  }),
});
