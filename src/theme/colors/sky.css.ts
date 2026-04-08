import {
  createGlobalThemeContract,
  createGlobalTheme,
  globalStyle,
  assignVars,
} from '@vanilla-extract/css';
import { vars } from '../contract.css';
import { colorContractShape } from './_common';

export const skyVars = createGlobalThemeContract(colorContractShape('sky'));

const lightValues = {
  1: '#f9feff',
  2: '#f1fafd',
  3: '#e1f6fd',
  4: '#d1f0fa',
  5: '#bee7f5',
  6: '#a9daed',
  7: '#8dcae3',
  8: '#60b3d7',
  9: '#7ce2fe',
  10: '#74daf8',
  11: '#00749e',
  12: '#1d3e56',
  a1: '#00d5ff06',
  a2: '#00a4db0e',
  a3: '#00b3ee1e',
  a4: '#00ace42e',
  a5: '#00a1d841',
  a6: '#0092ca56',
  a7: '#0089c172',
  a8: '#0085bf9f',
  a9: '#00c7fe83',
  a10: '#00bcf38b',
  a11: '#00749e',
  a12: '#002540e2',
  contrast: '#1c2024',
  surface: '#eef9fdcc',
  indicator: '#7ce2fe',
  track: '#7ce2fe',
};

const darkValues = {
  1: '#0d141f',
  2: '#111a27',
  3: '#112840',
  4: '#113555',
  5: '#154467',
  6: '#1b537b',
  7: '#1f6692',
  8: '#197cae',
  9: '#7ce2fe',
  10: '#a8eeff',
  11: '#75c7f0',
  12: '#c2f3ff',
  a1: '#0044ff0f',
  a2: '#1171fb18',
  a3: '#1184fc33',
  a4: '#128fff49',
  a5: '#1c9dfd5d',
  a6: '#28a5ff72',
  a7: '#2badfe8b',
  a8: '#1db2fea9',
  a9: '#7ce3fffe',
  a10: '#a8eeff',
  a11: '#7cd3ffef',
  a12: '#c2f3ff',
  contrast: '#1c2024',
  surface: '#13233b80',
  indicator: '#7ce2fe',
  track: '#7ce2fe',
};

createGlobalTheme(':root, [data-theme="light"]', skyVars, lightValues);
createGlobalTheme('[data-theme="dark"]', skyVars, darkValues);

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(skyVars, darkValues),
    },
  },
});

globalStyle('[data-accent-color="sky"]', {
  vars: assignVars(vars.accent, {
    1: skyVars[1],
    a1: skyVars.a1,
    2: skyVars[2],
    a2: skyVars.a2,
    3: skyVars[3],
    a3: skyVars.a3,
    4: skyVars[4],
    a4: skyVars.a4,
    5: skyVars[5],
    a5: skyVars.a5,
    6: skyVars[6],
    a6: skyVars.a6,
    7: skyVars[7],
    a7: skyVars.a7,
    8: skyVars[8],
    a8: skyVars.a8,
    9: skyVars[9],
    a9: skyVars.a9,
    10: skyVars[10],
    a10: skyVars.a10,
    11: skyVars[11],
    a11: skyVars.a11,
    12: skyVars[12],
    a12: skyVars.a12,
    contrast: skyVars.contrast,
    surface: skyVars.surface,
    indicator: skyVars.indicator,
    track: skyVars.track,
  }),
});
