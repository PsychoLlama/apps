import { globalStyle } from '@vanilla-extract/css';
import { vars } from './contract.css';

// Light mode semantic colors
const lightColors = {
  [vars.color.background]: 'white',
  [vars.color.overlay]: vars.black.a6,
  [vars.color.panelSolid]: 'white',
  [vars.color.panelTranslucent]: 'rgba(255, 255, 255, 0.7)',
  [vars.color.surface]: 'rgba(255, 255, 255, 0.85)',
  [vars.color.transparent]: 'rgb(0 0 0 / 0)',
};

// Dark mode semantic colors
const darkColors = {
  [vars.color.background]: vars.gray[1],
  [vars.color.overlay]: vars.black.a8,
  [vars.color.panelSolid]: vars.gray[2],
  [vars.color.panelTranslucent]: vars.gray.a2,
  [vars.color.surface]: 'rgba(0, 0, 0, 0.25)',
  [vars.color.transparent]: 'rgb(0 0 0 / 0)',
};

globalStyle(':root, [data-theme="light"]', { vars: lightColors });
globalStyle('[data-theme="dark"]', { vars: darkColors });

globalStyle(':root:not([data-theme])', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: darkColors,
    },
  },
});
