import { assignVars, globalStyle } from '@vanilla-extract/css';

import {
  blueDark,
  blueDarkAlpha,
  blueLight,
  blueLightAlpha,
} from './palette/blue.css';
import {
  grayDark,
  grayDarkAlpha,
  grayLight,
  grayLightAlpha,
} from './palette/gray.css';
import { colorContract } from './tokens/color.css';

const lightColorVars = assignVars(colorContract, {
  accent: blueLight,
  accentAlpha: blueLightAlpha,
  gray: grayLight,
  grayAlpha: grayLightAlpha,
});

const darkColorVars = assignVars(colorContract, {
  accent: blueDark,
  accentAlpha: blueDarkAlpha,
  gray: grayDark,
  grayAlpha: grayDarkAlpha,
});

// System preference
globalStyle(':root', {
  vars: lightColorVars,
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: darkColorVars,
    },
  },
});

// Explicit overrides
globalStyle(':root[data-theme="dark"]', { vars: darkColorVars });
globalStyle(':root[data-theme="light"]', { vars: lightColorVars });

export { colorContract };
