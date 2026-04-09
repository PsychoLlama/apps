import { createPalette } from '../color-scheme';
import {
  brownDark,
  brownDarkAlpha,
  brownLight,
  brownLightAlpha,
} from './brown';

export const brown = createPalette(brownLight, brownDark);
export const brownAlpha = createPalette(brownLightAlpha, brownDarkAlpha);
