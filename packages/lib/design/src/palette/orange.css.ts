import { createPalette } from '../color-scheme';
import {
  orangeDark,
  orangeDarkAlpha,
  orangeLight,
  orangeLightAlpha,
} from './orange';

export const orange = createPalette(orangeLight, orangeDark);
export const orangeAlpha = createPalette(orangeLightAlpha, orangeDarkAlpha);
