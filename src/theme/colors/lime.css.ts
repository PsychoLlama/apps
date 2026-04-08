import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const limeVars = createGlobalThemeContract(colorContractShape('lime'));

const lightValues = {
  1: '#fcfdfa',
  2: '#f8faf3',
  3: '#eef6d6',
  4: '#e2f0bd',
  5: '#d3e7a6',
  6: '#c2da91',
  7: '#abc978',
  8: '#8db654',
  9: '#bdee63',
  10: '#b0e64c',
  11: '#5c7c2f',
  12: '#37401c',
  a1: '#66990005',
  a2: '#6b95000c',
  a3: '#96c80029',
  a4: '#8fc60042',
  a5: '#81bb0059',
  a6: '#72aa006e',
  a7: '#61990087',
  a8: '#559200ab',
  a9: '#93e4009c',
  a10: '#8fdc00b3',
  a11: '#375f00d0',
  a12: '#1e2900e3',
  contrast: '#1d211c',
  surface: '#f6f9f0cc',
  indicator: '#bdee63',
  track: '#bdee63',
};

const darkValues = {
  1: '#11130c',
  2: '#151a10',
  3: '#1f2917',
  4: '#29371d',
  5: '#334423',
  6: '#3d522a',
  7: '#496231',
  8: '#577538',
  9: '#bdee63',
  10: '#d4ff70',
  11: '#bde56c',
  12: '#e3f7ba',
  a1: '#11bb0003',
  a2: '#78f7000a',
  a3: '#9bfd4c1a',
  a4: '#a7fe5c29',
  a5: '#affe6537',
  a6: '#b2fe6d46',
  a7: '#b6ff6f57',
  a8: '#b6fd6d6c',
  a9: '#caff69ed',
  a10: '#d4ff70',
  a11: '#d1fe77e4',
  a12: '#e9febff7',
  contrast: '#1d211c',
  surface: '#1b211580',
  indicator: '#bdee63',
  track: '#bdee63',
};

createGlobalTheme(':root, [data-theme="light"]', limeVars, lightValues);
createGlobalTheme('[data-theme="dark"]', limeVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(limeVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="lime"]', {
  vars: assignVars(vars.accent, {
    1: limeVars[1],
    a1: limeVars.a1,
    2: limeVars[2],
    a2: limeVars.a2,
    3: limeVars[3],
    a3: limeVars.a3,
    4: limeVars[4],
    a4: limeVars.a4,
    5: limeVars[5],
    a5: limeVars.a5,
    6: limeVars[6],
    a6: limeVars.a6,
    7: limeVars[7],
    a7: limeVars.a7,
    8: limeVars[8],
    a8: limeVars.a8,
    9: limeVars[9],
    a9: limeVars.a9,
    10: limeVars[10],
    a10: limeVars.a10,
    11: limeVars[11],
    a11: limeVars.a11,
    12: limeVars[12],
    a12: limeVars.a12,
    contrast: limeVars.contrast,
    surface: limeVars.surface,
    indicator: limeVars.indicator,
    track: limeVars.track,
  }),
});
