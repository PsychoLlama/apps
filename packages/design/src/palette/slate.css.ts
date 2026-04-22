import { createPalette } from '../color-scheme';
import {
  slateDark,
  slateDarkAlpha,
  slateLight,
  slateLightAlpha,
} from './slate';

export const slate = createPalette(slateLight, slateDark);
export const slateAlpha = createPalette(slateLightAlpha, slateDarkAlpha);
