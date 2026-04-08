import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const pinkVars = createGlobalThemeContract(colorContractShape('pink'));

const lightValues = {
  1: '#fffcfe',
  2: '#fef7fb',
  3: '#fee9f5',
  4: '#fbdcef',
  5: '#f6cee7',
  6: '#efbfdd',
  7: '#e7acd0',
  8: '#dd93c2',
  9: '#d6409f',
  10: '#cf3897',
  11: '#c2298a',
  12: '#651249',
  a1: '#ff00aa03',
  a2: '#e0008008',
  a3: '#f4008c16',
  a4: '#e2008b23',
  a5: '#d1008331',
  a6: '#c0007840',
  a7: '#b6006f53',
  a8: '#af006f6c',
  a9: '#c8007fbf',
  a10: '#c2007ac7',
  a11: '#b60074d6',
  a12: '#59003bed',
  contrast: 'white',
  surface: '#fef5facc',
  indicator: '#d6409f',
  track: '#d6409f',
};

const darkValues = {
  1: '#191117',
  2: '#21121d',
  3: '#37172f',
  4: '#4b143d',
  5: '#591c47',
  6: '#692955',
  7: '#833869',
  8: '#a84885',
  9: '#d6409f',
  10: '#de51a8',
  11: '#ff8dcc',
  12: '#fdd1ea',
  a1: '#f412bc09',
  a2: '#f420bb12',
  a3: '#fe37cc29',
  a4: '#fc1ec43f',
  a5: '#fd35c24e',
  a6: '#fd51c75f',
  a7: '#fd62c87b',
  a8: '#ff68c8a2',
  a9: '#fe49bcd4',
  a10: '#ff5cc0dc',
  a11: '#ff8dcc',
  a12: '#ffd3ecfd',
  contrast: 'white',
  surface: '#31132980',
  indicator: '#d6409f',
  track: '#d6409f',
};

createGlobalTheme(':root, [data-theme="light"]', pinkVars, lightValues);
createGlobalTheme('[data-theme="dark"]', pinkVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(pinkVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="pink"]', {
  vars: assignVars(vars.accent, {
    1: pinkVars[1],
    a1: pinkVars.a1,
    2: pinkVars[2],
    a2: pinkVars.a2,
    3: pinkVars[3],
    a3: pinkVars.a3,
    4: pinkVars[4],
    a4: pinkVars.a4,
    5: pinkVars[5],
    a5: pinkVars.a5,
    6: pinkVars[6],
    a6: pinkVars.a6,
    7: pinkVars[7],
    a7: pinkVars.a7,
    8: pinkVars[8],
    a8: pinkVars.a8,
    9: pinkVars[9],
    a9: pinkVars.a9,
    10: pinkVars[10],
    a10: pinkVars.a10,
    11: pinkVars[11],
    a11: pinkVars.a11,
    12: pinkVars[12],
    a12: pinkVars.a12,
    contrast: pinkVars.contrast,
    surface: pinkVars.surface,
    indicator: pinkVars.indicator,
    track: pinkVars.track,
  }),
});
