import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const plumVars = createGlobalThemeContract(colorContractShape('plum'));

const lightValues = {
  1: '#fefcff',
  2: '#fdf7fd',
  3: '#fbebfb',
  4: '#f7def8',
  5: '#f2d1f3',
  6: '#e9c2ec',
  7: '#deade3',
  8: '#cf91d8',
  9: '#ab4aba',
  10: '#a144af',
  11: '#953ea3',
  12: '#53195d',
  a1: '#aa00ff03',
  a2: '#c000c008',
  a3: '#cc00cc14',
  a4: '#c200c921',
  a5: '#b700bd2e',
  a6: '#a400b03d',
  a7: '#9900a852',
  a8: '#9000a56e',
  a9: '#89009eb5',
  a10: '#7f0092bb',
  a11: '#730086c1',
  a12: '#40004be6',
  contrast: 'white',
  surface: '#fdf5fdcc',
  indicator: '#ab4aba',
  track: '#ab4aba',
};

const darkValues = {
  1: '#181118',
  2: '#201320',
  3: '#351a35',
  4: '#451d47',
  5: '#512454',
  6: '#5e3061',
  7: '#734079',
  8: '#92549c',
  9: '#ab4aba',
  10: '#b658c4',
  11: '#e796f3',
  12: '#f4d4f4',
  a1: '#f112f108',
  a2: '#f22ff211',
  a3: '#fd4cfd27',
  a4: '#f646ff3a',
  a5: '#f455ff48',
  a6: '#f66dff56',
  a7: '#f07cfd70',
  a8: '#ee84ff95',
  a9: '#e961feb6',
  a10: '#ed70ffc0',
  a11: '#f19cfef3',
  a12: '#feddfef4',
  contrast: 'white',
  surface: '#2f152f80',
  indicator: '#ab4aba',
  track: '#ab4aba',
};

createGlobalTheme(':root, [data-theme="light"]', plumVars, lightValues);
createGlobalTheme('[data-theme="dark"]', plumVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(plumVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="plum"]', {
  vars: assignVars(vars.accent, {
    1: plumVars[1],
    a1: plumVars.a1,
    2: plumVars[2],
    a2: plumVars.a2,
    3: plumVars[3],
    a3: plumVars.a3,
    4: plumVars[4],
    a4: plumVars.a4,
    5: plumVars[5],
    a5: plumVars.a5,
    6: plumVars[6],
    a6: plumVars.a6,
    7: plumVars[7],
    a7: plumVars.a7,
    8: plumVars[8],
    a8: plumVars.a8,
    9: plumVars[9],
    a9: plumVars.a9,
    10: plumVars[10],
    a10: plumVars.a10,
    11: plumVars[11],
    a11: plumVars.a11,
    12: plumVars[12],
    a12: plumVars.a12,
    contrast: plumVars.contrast,
    surface: plumVars.surface,
    indicator: plumVars.indicator,
    track: plumVars.track,
  }),
});
