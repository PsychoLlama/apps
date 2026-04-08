import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const cyanVars = createGlobalThemeContract(colorContractShape('cyan'));

const lightValues = {
  1: '#fafdfe',
  2: '#f2fafb',
  3: '#def7f9',
  4: '#caf1f6',
  5: '#b5e9f0',
  6: '#9ddde7',
  7: '#7dcedc',
  8: '#3db9cf',
  9: '#00a2c7',
  10: '#0797b9',
  11: '#107d98',
  12: '#0d3c48',
  a1: '#0099cc05',
  a2: '#009db10d',
  a3: '#00c2d121',
  a4: '#00bcd435',
  a5: '#01b4cc4a',
  a6: '#00a7c162',
  a7: '#009fbb82',
  a8: '#00a3c0c2',
  a9: '#00a2c7',
  a10: '#0094b7f8',
  a11: '#007491ef',
  a12: '#00323ef2',
  contrast: 'white',
  surface: '#eff9facc',
  indicator: '#00a2c7',
  track: '#00a2c7',
};

const darkValues = {
  1: '#0b161a',
  2: '#101b20',
  3: '#082c36',
  4: '#003848',
  5: '#004558',
  6: '#045468',
  7: '#12677e',
  8: '#11809c',
  9: '#00a2c7',
  10: '#23afd0',
  11: '#4ccce6',
  12: '#b6ecf7',
  a1: '#0091f70a',
  a2: '#02a7f211',
  a3: '#00befd28',
  a4: '#00baff3b',
  a5: '#00befd4d',
  a6: '#00c7fd5e',
  a7: '#14cdff75',
  a8: '#11cfff95',
  a9: '#00cfffc3',
  a10: '#28d6ffcd',
  a11: '#52e1fee5',
  a12: '#bbf3fef7',
  contrast: 'white',
  surface: '#11252d80',
  indicator: '#00a2c7',
  track: '#00a2c7',
};

createGlobalTheme(':root, [data-theme="light"]', cyanVars, lightValues);
createGlobalTheme('[data-theme="dark"]', cyanVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(cyanVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="cyan"]', {
  vars: assignVars(vars.accent, {
    1: cyanVars[1],
    a1: cyanVars.a1,
    2: cyanVars[2],
    a2: cyanVars.a2,
    3: cyanVars[3],
    a3: cyanVars.a3,
    4: cyanVars[4],
    a4: cyanVars.a4,
    5: cyanVars[5],
    a5: cyanVars.a5,
    6: cyanVars[6],
    a6: cyanVars.a6,
    7: cyanVars[7],
    a7: cyanVars.a7,
    8: cyanVars[8],
    a8: cyanVars.a8,
    9: cyanVars[9],
    a9: cyanVars.a9,
    10: cyanVars[10],
    a10: cyanVars.a10,
    11: cyanVars[11],
    a11: cyanVars.a11,
    12: cyanVars[12],
    a12: cyanVars.a12,
    contrast: cyanVars.contrast,
    surface: cyanVars.surface,
    indicator: cyanVars.indicator,
    track: cyanVars.track,
  }),
});
