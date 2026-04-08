import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const amberVars = createGlobalThemeContract(colorContractShape('amber'));

const lightValues = {
  1: '#fefdfb',
  2: '#fefbe9',
  3: '#fff7c2',
  4: '#ffee9c',
  5: '#fbe577',
  6: '#f3d673',
  7: '#e9c162',
  8: '#e2a336',
  9: '#ffc53d',
  10: '#ffba18',
  11: '#ab6400',
  12: '#4f3422',
  a1: '#c0800004',
  a2: '#f4d10016',
  a3: '#ffde003d',
  a4: '#ffd40063',
  a5: '#f8cf0088',
  a6: '#eab5008c',
  a7: '#dc9b009d',
  a8: '#da8a00c9',
  a9: '#ffb300c2',
  a10: '#ffb300e7',
  a11: '#ab6400',
  a12: '#341500dd',
  contrast: '#21201c',
  surface: '#fefae4cc',
  indicator: '#ffc53d',
  track: '#ffc53d',
};

const darkValues = {
  1: '#16120c',
  2: '#1d180f',
  3: '#302008',
  4: '#3f2700',
  5: '#4d3000',
  6: '#5c3d05',
  7: '#714f19',
  8: '#8f6424',
  9: '#ffc53d',
  10: '#ffd60a',
  11: '#ffca16',
  12: '#ffe7b3',
  a1: '#e63c0006',
  a2: '#fd9b000d',
  a3: '#fa820022',
  a4: '#fc820032',
  a5: '#fd8b0041',
  a6: '#fd9b0051',
  a7: '#ffab2567',
  a8: '#ffae3587',
  a9: '#ffc53d',
  a10: '#ffd60a',
  a11: '#ffca16',
  a12: '#ffe7b3',
  contrast: '#21201c',
  surface: '#271f1380',
  indicator: '#ffc53d',
  track: '#ffc53d',
};

createGlobalTheme(':root, [data-theme="light"]', amberVars, lightValues);
createGlobalTheme('[data-theme="dark"]', amberVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(amberVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="amber"]', {
  vars: assignVars(vars.accent, {
    1: amberVars[1],
    a1: amberVars.a1,
    2: amberVars[2],
    a2: amberVars.a2,
    3: amberVars[3],
    a3: amberVars.a3,
    4: amberVars[4],
    a4: amberVars.a4,
    5: amberVars[5],
    a5: amberVars.a5,
    6: amberVars[6],
    a6: amberVars.a6,
    7: amberVars[7],
    a7: amberVars.a7,
    8: amberVars[8],
    a8: amberVars.a8,
    9: amberVars[9],
    a9: amberVars.a9,
    10: amberVars[10],
    a10: amberVars.a10,
    11: amberVars[11],
    a11: amberVars.a11,
    12: amberVars[12],
    a12: amberVars.a12,
    contrast: amberVars.contrast,
    surface: amberVars.surface,
    indicator: amberVars.indicator,
    track: amberVars.track,
  }),
});
