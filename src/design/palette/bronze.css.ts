import { createPalette } from '../color-scheme';
import {
  bronzeDark,
  bronzeDarkAlpha,
  bronzeLight,
  bronzeLightAlpha,
} from './bronze';

export const bronze = createPalette(bronzeLight, bronzeDark);
export const bronzeAlpha = createPalette(bronzeLightAlpha, bronzeDarkAlpha);
