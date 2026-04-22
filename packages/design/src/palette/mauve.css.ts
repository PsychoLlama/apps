import { createPalette } from '../color-scheme';
import {
  mauveDark,
  mauveDarkAlpha,
  mauveLight,
  mauveLightAlpha,
} from './mauve';

export const mauve = createPalette(mauveLight, mauveDark);
export const mauveAlpha = createPalette(mauveLightAlpha, mauveDarkAlpha);
