import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const indigoVars = createGlobalThemeContract(
  colorContractShape('indigo'),
);

const lightValues = {
  1: '#fdfdfe',
  2: '#f7f9ff',
  3: '#edf2fe',
  4: '#e1e9ff',
  5: '#d2deff',
  6: '#c1d0ff',
  7: '#abbdf9',
  8: '#8da4ef',
  9: '#3e63dd',
  10: '#3358d4',
  11: '#3a5bc7',
  12: '#1f2d5c',
  a1: '#00008002',
  a2: '#0040ff08',
  a3: '#0047f112',
  a4: '#0044ff1e',
  a5: '#0044ff2d',
  a6: '#003eff3e',
  a7: '#0037ed54',
  a8: '#0034dc72',
  a9: '#0031d2c1',
  a10: '#002ec9cc',
  a11: '#002bb7c5',
  a12: '#001046e0',
  contrast: 'white',
  surface: '#f5f8ffcc',
  indicator: '#3e63dd',
  track: '#3e63dd',
};

const darkValues = {
  1: '#11131f',
  2: '#141726',
  3: '#182449',
  4: '#1d2e62',
  5: '#253974',
  6: '#304384',
  7: '#3a4f97',
  8: '#435db1',
  9: '#3e63dd',
  10: '#5472e4',
  11: '#9eb1ff',
  12: '#d6e1ff',
  a1: '#1133ff0f',
  a2: '#3354fa17',
  a3: '#2f62ff3c',
  a4: '#3566ff57',
  a5: '#4171fd6b',
  a6: '#5178fd7c',
  a7: '#5a7fff90',
  a8: '#5b81feac',
  a9: '#4671ffdb',
  a10: '#5c7efee3',
  a11: '#9eb1ff',
  a12: '#d6e1ff',
  contrast: 'white',
  surface: '#171d3b80',
  indicator: '#3e63dd',
  track: '#3e63dd',
};

createGlobalTheme(':root, [data-theme="light"]', indigoVars, lightValues);
createGlobalTheme('[data-theme="dark"]', indigoVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(indigoVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="indigo"]', {
  vars: assignVars(vars.accent, {
    1: indigoVars[1],
    a1: indigoVars.a1,
    2: indigoVars[2],
    a2: indigoVars.a2,
    3: indigoVars[3],
    a3: indigoVars.a3,
    4: indigoVars[4],
    a4: indigoVars.a4,
    5: indigoVars[5],
    a5: indigoVars.a5,
    6: indigoVars[6],
    a6: indigoVars.a6,
    7: indigoVars[7],
    a7: indigoVars.a7,
    8: indigoVars[8],
    a8: indigoVars.a8,
    9: indigoVars[9],
    a9: indigoVars.a9,
    10: indigoVars[10],
    a10: indigoVars.a10,
    11: indigoVars[11],
    a11: indigoVars.a11,
    12: indigoVars[12],
    a12: indigoVars.a12,
    contrast: indigoVars.contrast,
    surface: indigoVars.surface,
    indicator: indigoVars.indicator,
    track: indigoVars.track,
  }),
});
