import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const crimsonVars = createGlobalThemeContract(
  colorContractShape('crimson'),
);

const lightValues = {
  1: '#fffcfd',
  2: '#fef7f9',
  3: '#ffe9f0',
  4: '#fedce7',
  5: '#facedd',
  6: '#f3bed1',
  7: '#eaacc3',
  8: '#e093b2',
  9: '#e93d82',
  10: '#df3478',
  11: '#cb1d63',
  12: '#621639',
  a1: '#ff005503',
  a2: '#e0004008',
  a3: '#ff005216',
  a4: '#f8005123',
  a5: '#e5004f31',
  a6: '#d0004b41',
  a7: '#bf004753',
  a8: '#b6004a6c',
  a9: '#e2005bc2',
  a10: '#d70056cb',
  a11: '#c4004fe2',
  a12: '#530026e9',
  contrast: 'white',
  surface: '#fef5f8cc',
  indicator: '#e93d82',
  track: '#e93d82',
};

const darkValues = {
  1: '#191114',
  2: '#201318',
  3: '#381525',
  4: '#4d122f',
  5: '#5c1839',
  6: '#6d2545',
  7: '#873356',
  8: '#b0436e',
  9: '#e93d82',
  10: '#ee518a',
  11: '#ff92ad',
  12: '#fdd3e8',
  a1: '#f4126709',
  a2: '#f22f7a11',
  a3: '#fe2a8b2a',
  a4: '#fd158741',
  a5: '#fd278f51',
  a6: '#fe459763',
  a7: '#fd559b7f',
  a8: '#fe5b9bab',
  a9: '#fe418de8',
  a10: '#ff5693ed',
  a11: '#ff92ad',
  a12: '#ffd5eafd',
  contrast: 'white',
  surface: '#2f151f80',
  indicator: '#e93d82',
  track: '#e93d82',
};

createGlobalTheme(':root, [data-theme="light"]', crimsonVars, lightValues);
createGlobalTheme('[data-theme="dark"]', crimsonVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(crimsonVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="crimson"]', {
  vars: assignVars(vars.accent, {
    1: crimsonVars[1],
    a1: crimsonVars.a1,
    2: crimsonVars[2],
    a2: crimsonVars.a2,
    3: crimsonVars[3],
    a3: crimsonVars.a3,
    4: crimsonVars[4],
    a4: crimsonVars.a4,
    5: crimsonVars[5],
    a5: crimsonVars.a5,
    6: crimsonVars[6],
    a6: crimsonVars.a6,
    7: crimsonVars[7],
    a7: crimsonVars.a7,
    8: crimsonVars[8],
    a8: crimsonVars.a8,
    9: crimsonVars[9],
    a9: crimsonVars.a9,
    10: crimsonVars[10],
    a10: crimsonVars.a10,
    11: crimsonVars[11],
    a11: crimsonVars.a11,
    12: crimsonVars[12],
    a12: crimsonVars.a12,
    contrast: crimsonVars.contrast,
    surface: crimsonVars.surface,
    indicator: crimsonVars.indicator,
    track: crimsonVars.track,
  }),
});
