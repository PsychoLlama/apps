import { assignVars, globalStyle } from '@vanilla-extract/css';

import {
  blueDark,
  blueDarkAlpha,
  blueLight,
  blueLightAlpha,
} from './palette/blue.css';
import {
  slateDark,
  slateDarkAlpha,
  slateLight,
  slateLightAlpha,
} from './palette/slate.css';
import { colorContract } from './tokens/color.css';

/**
 * Follow this guide to choose a color palette:
 * https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
 */

const lightColorVars = assignVars(colorContract, {
  accent: blueLight,
  accentAlpha: blueLightAlpha,
  gray: slateLight,
  grayAlpha: slateLightAlpha,
});

const darkColorVars = assignVars(colorContract, {
  accent: blueDark,
  accentAlpha: blueDarkAlpha,
  gray: slateDark,
  grayAlpha: slateDarkAlpha,
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
