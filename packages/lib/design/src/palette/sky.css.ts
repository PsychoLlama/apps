import { createPalette } from '../color-scheme';
import { skyDark, skyDarkAlpha, skyLight, skyLightAlpha } from './sky';

export const sky = createPalette(skyLight, skyDark);
export const skyAlpha = createPalette(skyLightAlpha, skyDarkAlpha);
