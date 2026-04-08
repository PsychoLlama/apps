import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const redVars = createGlobalThemeContract(colorContractShape('red'));

const lightValues = {
  1: '#fffcfc',
  2: '#fff7f7',
  3: '#feebec',
  4: '#ffdbdc',
  5: '#ffcdce',
  6: '#fdbdbe',
  7: '#f4a9aa',
  8: '#eb8e90',
  9: '#e5484d',
  10: '#dc3e42',
  11: '#ce2c31',
  12: '#641723',
  a1: '#ff000003',
  a2: '#ff000008',
  a3: '#f3000d14',
  a4: '#ff000824',
  a5: '#ff000632',
  a6: '#f8000442',
  a7: '#df000356',
  a8: '#d2000571',
  a9: '#db0007b7',
  a10: '#d10005c1',
  a11: '#c40006d3',
  a12: '#55000de8',
  contrast: 'white',
  surface: '#fff5f5cc',
  indicator: '#e5484d',
  track: '#e5484d',
};

const darkValues = {
  1: '#191111',
  2: '#201314',
  3: '#3b1219',
  4: '#500f1c',
  5: '#611623',
  6: '#72232d',
  7: '#8c333a',
  8: '#b54548',
  9: '#e5484d',
  10: '#ec5d5e',
  11: '#ff9592',
  12: '#ffd1d9',
  a1: '#f4121209',
  a2: '#f22f3e11',
  a3: '#ff173f2d',
  a4: '#fe0a3b44',
  a5: '#ff204756',
  a6: '#ff3e5668',
  a7: '#ff536184',
  a8: '#ff5d61b0',
  a9: '#fe4e54e4',
  a10: '#ff6465eb',
  a11: '#ff9592',
  a12: '#ffd1d9',
  contrast: 'white',
  surface: '#2f151780',
  indicator: '#e5484d',
  track: '#e5484d',
};

createGlobalTheme(':root, [data-theme="light"]', redVars, lightValues);
createGlobalTheme('[data-theme="dark"]', redVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(redVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="red"]', {
  vars: assignVars(vars.accent, {
    1: redVars[1],
    a1: redVars.a1,
    2: redVars[2],
    a2: redVars.a2,
    3: redVars[3],
    a3: redVars.a3,
    4: redVars[4],
    a4: redVars.a4,
    5: redVars[5],
    a5: redVars.a5,
    6: redVars[6],
    a6: redVars.a6,
    7: redVars[7],
    a7: redVars.a7,
    8: redVars[8],
    a8: redVars.a8,
    9: redVars[9],
    a9: redVars.a9,
    10: redVars[10],
    a10: redVars.a10,
    11: redVars[11],
    a11: redVars.a11,
    12: redVars[12],
    a12: redVars.a12,
    contrast: redVars.contrast,
    surface: redVars.surface,
    indicator: redVars.indicator,
    track: redVars.track,
  }),
});
