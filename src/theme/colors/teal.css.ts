import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const tealVars = createGlobalThemeContract(colorContractShape('teal'));

const lightValues = {
  1: '#fafefd',
  2: '#f3fbf9',
  3: '#e0f8f3',
  4: '#ccf3ea',
  5: '#b8eae0',
  6: '#a1ded2',
  7: '#83cdc1',
  8: '#53b9ab',
  9: '#12a594',
  10: '#0d9b8a',
  11: '#008573',
  12: '#0d3d38',
  a1: '#00cc9905',
  a2: '#00aa800c',
  a3: '#00c69d1f',
  a4: '#00c39633',
  a5: '#00b49047',
  a6: '#00a6855e',
  a7: '#0099807c',
  a8: '#009783ac',
  a9: '#009e8ced',
  a10: '#009684f2',
  a11: '#008573',
  a12: '#00332df2',
  contrast: 'white',
  surface: '#f0faf8cc',
  indicator: '#12a594',
  track: '#12a594',
};

const darkValues = {
  1: '#0d1514',
  2: '#111c1b',
  3: '#0d2d2a',
  4: '#023b37',
  5: '#084843',
  6: '#145750',
  7: '#1c6961',
  8: '#207e73',
  9: '#12a594',
  10: '#0eb39e',
  11: '#0bd8b6',
  12: '#adf0dd',
  a1: '#00deab05',
  a2: '#12fbe60c',
  a3: '#00ffe61e',
  a4: '#00ffe92d',
  a5: '#00ffea3b',
  a6: '#1cffe84b',
  a7: '#2efde85f',
  a8: '#32ffe775',
  a9: '#13ffe49f',
  a10: '#0dffe0ae',
  a11: '#0afed5d6',
  a12: '#b8ffebef',
  contrast: 'white',
  surface: '#13272580',
  indicator: '#12a594',
  track: '#12a594',
};

createGlobalTheme(':root, [data-theme="light"]', tealVars, lightValues);
createGlobalTheme('[data-theme="dark"]', tealVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(tealVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="teal"]', {
  vars: assignVars(vars.accent, {
    1: tealVars[1],
    a1: tealVars.a1,
    2: tealVars[2],
    a2: tealVars.a2,
    3: tealVars[3],
    a3: tealVars.a3,
    4: tealVars[4],
    a4: tealVars.a4,
    5: tealVars[5],
    a5: tealVars.a5,
    6: tealVars[6],
    a6: tealVars.a6,
    7: tealVars[7],
    a7: tealVars.a7,
    8: tealVars[8],
    a8: tealVars.a8,
    9: tealVars[9],
    a9: tealVars.a9,
    10: tealVars[10],
    a10: tealVars.a10,
    11: tealVars[11],
    a11: tealVars.a11,
    12: tealVars[12],
    a12: tealVars.a12,
    contrast: tealVars.contrast,
    surface: tealVars.surface,
    indicator: tealVars.indicator,
    track: tealVars.track,
  }),
});
