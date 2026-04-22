import { createPalette } from '../color-scheme';
import { redDark, redDarkAlpha, redLight, redLightAlpha } from './red';

export const red = createPalette(redLight, redDark);
export const redAlpha = createPalette(redLightAlpha, redDarkAlpha);
