import { createPalette } from '../color-scheme';
import { cyanDark, cyanDarkAlpha, cyanLight, cyanLightAlpha } from './cyan';

export const cyan = createPalette(cyanLight, cyanDark);
export const cyanAlpha = createPalette(cyanLightAlpha, cyanDarkAlpha);
