import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const yellowVars = createGlobalThemeContract(
  colorContractShape('yellow'),
);

const lightValues = {
  1: '#fdfdf9',
  2: '#fefce9',
  3: '#fffab8',
  4: '#fff394',
  5: '#ffe770',
  6: '#f3d768',
  7: '#e4c767',
  8: '#d5ae39',
  9: '#ffe629',
  10: '#ffdc00',
  11: '#9e6c00',
  12: '#473b1f',
  a1: '#aaaa0006',
  a2: '#f4dd0016',
  a3: '#ffee0047',
  a4: '#ffe3016b',
  a5: '#ffd5008f',
  a6: '#ebbc0097',
  a7: '#d2a10098',
  a8: '#c99700c6',
  a9: '#ffe100d6',
  a10: '#ffdc00',
  a11: '#9e6c00',
  a12: '#2e2000e0',
  contrast: '#21201c',
  surface: '#fefbe4cc',
  indicator: '#ffe629',
  track: '#ffe629',
};

const darkValues = {
  1: '#14120b',
  2: '#1b180f',
  3: '#2d2305',
  4: '#362b00',
  5: '#433500',
  6: '#524202',
  7: '#665417',
  8: '#836a21',
  9: '#ffe629',
  10: '#ffff57',
  11: '#f5e147',
  12: '#f6eeb4',
  a1: '#d1510004',
  a2: '#f9b4000b',
  a3: '#ffaa001e',
  a4: '#fdb70028',
  a5: '#febb0036',
  a6: '#fec40046',
  a7: '#fdcb225c',
  a8: '#fdca327b',
  a9: '#ffe629',
  a10: '#ffff57',
  a11: '#fee949f5',
  a12: '#fef6baf6',
  contrast: '#21201c',
  surface: '#231f1380',
  indicator: '#ffe629',
  track: '#ffe629',
};

createGlobalTheme(':root, [data-theme="light"]', yellowVars, lightValues);
createGlobalTheme('[data-theme="dark"]', yellowVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(yellowVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="yellow"]', {
  vars: assignVars(vars.accent, {
    1: yellowVars[1],
    a1: yellowVars.a1,
    2: yellowVars[2],
    a2: yellowVars.a2,
    3: yellowVars[3],
    a3: yellowVars.a3,
    4: yellowVars[4],
    a4: yellowVars.a4,
    5: yellowVars[5],
    a5: yellowVars.a5,
    6: yellowVars[6],
    a6: yellowVars.a6,
    7: yellowVars[7],
    a7: yellowVars.a7,
    8: yellowVars[8],
    a8: yellowVars.a8,
    9: yellowVars[9],
    a9: yellowVars.a9,
    10: yellowVars[10],
    a10: yellowVars.a10,
    11: yellowVars[11],
    a11: yellowVars.a11,
    12: yellowVars[12],
    a12: yellowVars.a12,
    contrast: yellowVars.contrast,
    surface: yellowVars.surface,
    indicator: yellowVars.indicator,
    track: yellowVars.track,
  }),
});
