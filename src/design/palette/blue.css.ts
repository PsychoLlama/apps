import { createPalette } from '../color-scheme';
import { blueDark, blueDarkAlpha, blueLight, blueLightAlpha } from './blue';

export const blue = createPalette(blueLight, blueDark);
export const blueAlpha = createPalette(blueLightAlpha, blueDarkAlpha);
