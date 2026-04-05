import { assignVars, globalStyle } from '@vanilla-extract/css';

import {
  blueDark,
  blueDarkAlpha,
  blueLight,
  blueLightAlpha,
} from './palette/blue.css';
import { grayDark, grayLight } from './palette/gray.css';
import {
  slateDark,
  slateDarkAlpha,
  slateLight,
  slateLightAlpha,
} from './palette/slate.css';
import { colorContract } from './tokens/color.css';
import { textContract } from './tokens/text.css';

/**
 * Follow this guide to choose a color palette:
 * https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
 */

const lightThemeVars = {
  ...assignVars(colorContract, {
    accent: blueLight,
    accentAlpha: blueLightAlpha,
    neutral: slateLight,
    neutralAlpha: slateLightAlpha,
  }),
  ...assignVars(textContract, {
    lowContrast: grayLight[11],
    highContrast: grayLight[12],
  }),
};

const darkThemeVars = {
  ...assignVars(colorContract, {
    accent: blueDark,
    accentAlpha: blueDarkAlpha,
    neutral: slateDark,
    neutralAlpha: slateDarkAlpha,
  }),
  ...assignVars(textContract, {
    lowContrast: grayDark[11],
    highContrast: grayDark[12],
  }),
};

// System preference
globalStyle(':root', {
  vars: lightThemeVars,
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: darkThemeVars,
    },
  },
});

// Explicit overrides
globalStyle(':root[data-theme="dark"]', { vars: darkThemeVars });
globalStyle(':root[data-theme="light"]', { vars: lightThemeVars });

export { colorContract, textContract };
