import { createPalette } from '../color-scheme';
import {
  crimsonDark,
  crimsonDarkAlpha,
  crimsonLight,
  crimsonLightAlpha,
} from './crimson';

export const crimson = createPalette(crimsonLight, crimsonDark);
export const crimsonAlpha = createPalette(crimsonLightAlpha, crimsonDarkAlpha);
