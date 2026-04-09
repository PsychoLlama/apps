import { createPalette } from '../color-scheme';
import { limeDark, limeDarkAlpha, limeLight, limeLightAlpha } from './lime';

export const lime = createPalette(limeLight, limeDark);
export const limeAlpha = createPalette(limeLightAlpha, limeDarkAlpha);
