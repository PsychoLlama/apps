import { createPalette } from '../color-scheme';
import { irisDark, irisDarkAlpha, irisLight, irisLightAlpha } from './iris';

export const iris = createPalette(irisLight, irisDark);
export const irisAlpha = createPalette(irisLightAlpha, irisDarkAlpha);
