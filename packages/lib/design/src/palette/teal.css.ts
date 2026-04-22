import { createPalette } from '../color-scheme';
import { tealDark, tealDarkAlpha, tealLight, tealLightAlpha } from './teal';

export const teal = createPalette(tealLight, tealDark);
export const tealAlpha = createPalette(tealLightAlpha, tealDarkAlpha);
