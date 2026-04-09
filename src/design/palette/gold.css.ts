import { createPalette } from '../color-scheme';
import { goldDark, goldDarkAlpha, goldLight, goldLightAlpha } from './gold';

export const gold = createPalette(goldLight, goldDark);
export const goldAlpha = createPalette(goldLightAlpha, goldDarkAlpha);
