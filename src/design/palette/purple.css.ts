import { createPalette } from '../color-scheme';
import {
  purpleDark,
  purpleDarkAlpha,
  purpleLight,
  purpleLightAlpha,
} from './purple';

export const purple = createPalette(purpleLight, purpleDark);
export const purpleAlpha = createPalette(purpleLightAlpha, purpleDarkAlpha);
