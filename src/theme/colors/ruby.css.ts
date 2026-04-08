import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const rubyVars = createGlobalThemeContract(colorContractShape('ruby'));

const lightValues = {
  1: '#fffcfd',
  2: '#fff7f8',
  3: '#feeaed',
  4: '#ffdce1',
  5: '#ffced6',
  6: '#f8bfc8',
  7: '#efacb8',
  8: '#e592a3',
  9: '#e54666',
  10: '#dc3b5d',
  11: '#ca244d',
  12: '#64172b',
  a1: '#ff005503',
  a2: '#ff002008',
  a3: '#f3002515',
  a4: '#ff002523',
  a5: '#ff002a31',
  a6: '#e4002440',
  a7: '#ce002553',
  a8: '#c300286d',
  a9: '#db002cb9',
  a10: '#d2002cc4',
  a11: '#c10030db',
  a12: '#550016e8',
  contrast: 'white',
  surface: '#fff5f6cc',
  indicator: '#e54666',
  track: '#e54666',
};

const darkValues = {
  1: '#191113',
  2: '#1e1517',
  3: '#3a141e',
  4: '#4e1325',
  5: '#5e1a2e',
  6: '#6f2539',
  7: '#883447',
  8: '#b3445a',
  9: '#e54666',
  10: '#ec5a72',
  11: '#ff949d',
  12: '#fed2e1',
  a1: '#f4124a09',
  a2: '#fe5a7f0e',
  a3: '#ff235d2c',
  a4: '#fd195e42',
  a5: '#fe2d6b53',
  a6: '#ff447665',
  a7: '#ff577d80',
  a8: '#ff5c7cae',
  a9: '#fe4c70e4',
  a10: '#ff617beb',
  a11: '#ff949d',
  a12: '#ffd3e2fe',
  contrast: 'white',
  surface: '#2b191d80',
  indicator: '#e54666',
  track: '#e54666',
};

createGlobalTheme(':root, [data-theme="light"]', rubyVars, lightValues);
createGlobalTheme('[data-theme="dark"]', rubyVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(rubyVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="ruby"]', {
  vars: assignVars(vars.accent, {
    1: rubyVars[1],
    a1: rubyVars.a1,
    2: rubyVars[2],
    a2: rubyVars.a2,
    3: rubyVars[3],
    a3: rubyVars.a3,
    4: rubyVars[4],
    a4: rubyVars.a4,
    5: rubyVars[5],
    a5: rubyVars.a5,
    6: rubyVars[6],
    a6: rubyVars.a6,
    7: rubyVars[7],
    a7: rubyVars.a7,
    8: rubyVars[8],
    a8: rubyVars.a8,
    9: rubyVars[9],
    a9: rubyVars.a9,
    10: rubyVars[10],
    a10: rubyVars.a10,
    11: rubyVars[11],
    a11: rubyVars.a11,
    12: rubyVars[12],
    a12: rubyVars.a12,
    contrast: rubyVars.contrast,
    surface: rubyVars.surface,
    indicator: rubyVars.indicator,
    track: rubyVars.track,
  }),
});
