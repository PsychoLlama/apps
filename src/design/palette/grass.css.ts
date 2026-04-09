import { createPalette } from '../color-scheme';
import {
  grassDark,
  grassDarkAlpha,
  grassLight,
  grassLightAlpha,
} from './grass';

export const grass = createPalette(grassLight, grassDark);
export const grassAlpha = createPalette(grassLightAlpha, grassDarkAlpha);
