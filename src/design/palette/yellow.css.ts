import { createPalette } from '../color-scheme';
import {
  yellowDark,
  yellowDarkAlpha,
  yellowLight,
  yellowLightAlpha,
} from './yellow';

export const yellow = createPalette(yellowLight, yellowDark);
export const yellowAlpha = createPalette(yellowLightAlpha, yellowDarkAlpha);
