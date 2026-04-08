import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const tomatoVars = createGlobalThemeContract(
  colorContractShape('tomato'),
);

const lightValues = {
  1: '#fffcfc',
  2: '#fff8f7',
  3: '#feebe7',
  4: '#ffdcd3',
  5: '#ffcdc2',
  6: '#fdbdaf',
  7: '#f5a898',
  8: '#ec8e7b',
  9: '#e54d2e',
  10: '#dd4425',
  11: '#d13415',
  12: '#5c271f',
  a1: '#ff000003',
  a2: '#ff200008',
  a3: '#f52b0018',
  a4: '#ff35002c',
  a5: '#ff2e003d',
  a6: '#f92d0050',
  a7: '#e7280067',
  a8: '#db250084',
  a9: '#df2600d1',
  a10: '#d72400da',
  a11: '#cd2200ea',
  a12: '#460900e0',
  contrast: 'white',
  surface: '#fff6f5cc',
  indicator: '#e54d2e',
  track: '#e54d2e',
};

const darkValues = {
  1: '#181111',
  2: '#1f1513',
  3: '#391714',
  4: '#4e1511',
  5: '#5e1c16',
  6: '#6e2920',
  7: '#853a2d',
  8: '#ac4d39',
  9: '#e54d2e',
  10: '#ec6142',
  11: '#ff977d',
  12: '#fbd3cb',
  a1: '#f1121208',
  a2: '#ff55330f',
  a3: '#ff35232b',
  a4: '#fd201142',
  a5: '#fe332153',
  a6: '#ff4f3864',
  a7: '#fd644a7d',
  a8: '#fe6d4ea7',
  a9: '#fe5431e4',
  a10: '#ff6847eb',
  a11: '#ff977d',
  a12: '#ffd6cefb',
  contrast: 'white',
  surface: '#2d191580',
  indicator: '#e54d2e',
  track: '#e54d2e',
};

createGlobalTheme(':root, [data-theme="light"]', tomatoVars, lightValues);
createGlobalTheme('[data-theme="dark"]', tomatoVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(tomatoVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="tomato"]', {
  vars: assignVars(vars.accent, {
    1: tomatoVars[1],
    a1: tomatoVars.a1,
    2: tomatoVars[2],
    a2: tomatoVars.a2,
    3: tomatoVars[3],
    a3: tomatoVars.a3,
    4: tomatoVars[4],
    a4: tomatoVars.a4,
    5: tomatoVars[5],
    a5: tomatoVars.a5,
    6: tomatoVars[6],
    a6: tomatoVars.a6,
    7: tomatoVars[7],
    a7: tomatoVars.a7,
    8: tomatoVars[8],
    a8: tomatoVars.a8,
    9: tomatoVars[9],
    a9: tomatoVars.a9,
    10: tomatoVars[10],
    a10: tomatoVars.a10,
    11: tomatoVars[11],
    a11: tomatoVars.a11,
    12: tomatoVars[12],
    a12: tomatoVars.a12,
    contrast: tomatoVars.contrast,
    surface: tomatoVars.surface,
    indicator: tomatoVars.indicator,
    track: tomatoVars.track,
  }),
});
