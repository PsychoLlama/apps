import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const mintVars = createGlobalThemeContract(colorContractShape('mint'));

const lightValues = {
  1: '#f9fefd',
  2: '#f2fbf9',
  3: '#ddf9f2',
  4: '#c8f4e9',
  5: '#b3ecde',
  6: '#9ce0d0',
  7: '#7ecfbd',
  8: '#4cbba5',
  9: '#86ead4',
  10: '#7de0cb',
  11: '#027864',
  12: '#16433c',
  a1: '#00d5aa06',
  a2: '#00b18a0d',
  a3: '#00d29e22',
  a4: '#00cc9937',
  a5: '#00c0914c',
  a6: '#00b08663',
  a7: '#00a17d81',
  a8: '#009e7fb3',
  a9: '#00d3a579',
  a10: '#00c39982',
  a11: '#007763fd',
  a12: '#00312ae9',
  contrast: '#1a211e',
  surface: '#effaf8cc',
  indicator: '#86ead4',
  track: '#86ead4',
};

const darkValues = {
  1: '#0e1515',
  2: '#0f1b1b',
  3: '#092c2b',
  4: '#003a38',
  5: '#004744',
  6: '#105650',
  7: '#1e685f',
  8: '#277f70',
  9: '#86ead4',
  10: '#a8f5e5',
  11: '#58d5ba',
  12: '#c4f5e1',
  a1: '#00dede05',
  a2: '#00f9f90b',
  a3: '#00fff61d',
  a4: '#00fff42c',
  a5: '#00fff23a',
  a6: '#0effeb4a',
  a7: '#34fde55e',
  a8: '#41ffdf76',
  a9: '#92ffe7e9',
  a10: '#aefeedf5',
  a11: '#67ffded2',
  a12: '#cbfee9f5',
  contrast: '#1a211e',
  surface: '#15272780',
  indicator: '#86ead4',
  track: '#86ead4',
};

createGlobalTheme(':root, [data-theme="light"]', mintVars, lightValues);
createGlobalTheme('[data-theme="dark"]', mintVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(mintVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="mint"]', {
  vars: assignVars(vars.accent, {
    1: mintVars[1],
    a1: mintVars.a1,
    2: mintVars[2],
    a2: mintVars.a2,
    3: mintVars[3],
    a3: mintVars.a3,
    4: mintVars[4],
    a4: mintVars.a4,
    5: mintVars[5],
    a5: mintVars.a5,
    6: mintVars[6],
    a6: mintVars.a6,
    7: mintVars[7],
    a7: mintVars.a7,
    8: mintVars[8],
    a8: mintVars.a8,
    9: mintVars[9],
    a9: mintVars.a9,
    10: mintVars[10],
    a10: mintVars.a10,
    11: mintVars[11],
    a11: mintVars.a11,
    12: mintVars[12],
    a12: mintVars.a12,
    contrast: mintVars.contrast,
    surface: mintVars.surface,
    indicator: mintVars.indicator,
    track: mintVars.track,
  }),
});
