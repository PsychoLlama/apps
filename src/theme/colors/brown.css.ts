import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const brownVars = createGlobalThemeContract(colorContractShape('brown'));

const lightValues = {
  1: '#fefdfc',
  2: '#fcf9f6',
  3: '#f6eee7',
  4: '#f0e4d9',
  5: '#ebdaca',
  6: '#e4cdb7',
  7: '#dcbc9f',
  8: '#cea37e',
  9: '#ad7f58',
  10: '#a07553',
  11: '#815e46',
  12: '#3e332e',
  a1: '#aa550003',
  a2: '#aa550009',
  a3: '#a04b0018',
  a4: '#9b4a0026',
  a5: '#9f4d0035',
  a6: '#a04e0048',
  a7: '#a34e0060',
  a8: '#9f4a0081',
  a9: '#823c00a7',
  a10: '#723300ac',
  a11: '#522100b9',
  a12: '#140600d1',
  contrast: 'white',
  surface: '#fbf8f4cc',
  indicator: '#ad7f58',
  track: '#ad7f58',
};

const darkValues = {
  1: '#12110f',
  2: '#1c1816',
  3: '#28211d',
  4: '#322922',
  5: '#3e3128',
  6: '#4d3c2f',
  7: '#614a39',
  8: '#7c5f46',
  9: '#ad7f58',
  10: '#b88c67',
  11: '#dbb594',
  12: '#f2e1ca',
  a1: '#91110002',
  a2: '#fba67c0c',
  a3: '#fcb58c19',
  a4: '#fbbb8a24',
  a5: '#fcb88931',
  a6: '#fdba8741',
  a7: '#ffbb8856',
  a8: '#ffbe8773',
  a9: '#feb87da8',
  a10: '#ffc18cb3',
  a11: '#fed1aad9',
  a12: '#feecd4f2',
  contrast: 'white',
  surface: '#271f1b80',
  indicator: '#ad7f58',
  track: '#ad7f58',
};

createGlobalTheme(':root, [data-theme="light"]', brownVars, lightValues);
createGlobalTheme('[data-theme="dark"]', brownVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(brownVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="brown"]', {
  vars: assignVars(vars.accent, {
    1: brownVars[1],
    a1: brownVars.a1,
    2: brownVars[2],
    a2: brownVars.a2,
    3: brownVars[3],
    a3: brownVars.a3,
    4: brownVars[4],
    a4: brownVars.a4,
    5: brownVars[5],
    a5: brownVars.a5,
    6: brownVars[6],
    a6: brownVars.a6,
    7: brownVars[7],
    a7: brownVars.a7,
    8: brownVars[8],
    a8: brownVars.a8,
    9: brownVars[9],
    a9: brownVars.a9,
    10: brownVars[10],
    a10: brownVars.a10,
    11: brownVars[11],
    a11: brownVars.a11,
    12: brownVars[12],
    a12: brownVars.a12,
    contrast: brownVars.contrast,
    surface: brownVars.surface,
    indicator: brownVars.indicator,
    track: brownVars.track,
  }),
});
