import { createPalette } from '../color-scheme';
import {
  oliveDark,
  oliveDarkAlpha,
  oliveLight,
  oliveLightAlpha,
} from './olive';

export const olive = createPalette(oliveLight, oliveDark);
export const oliveAlpha = createPalette(oliveLightAlpha, oliveDarkAlpha);
