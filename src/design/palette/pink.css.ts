import { createPalette } from '../color-scheme';
import { pinkDark, pinkDarkAlpha, pinkLight, pinkLightAlpha } from './pink';

export const pink = createPalette(pinkLight, pinkDark);
export const pinkAlpha = createPalette(pinkLightAlpha, pinkDarkAlpha);
