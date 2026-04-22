import { createPalette } from '../color-scheme';
import {
  violetDark,
  violetDarkAlpha,
  violetLight,
  violetLightAlpha,
} from './violet';

export const violet = createPalette(violetLight, violetDark);
export const violetAlpha = createPalette(violetLightAlpha, violetDarkAlpha);
