import { createPalette } from '../color-scheme';
import { mintDark, mintDarkAlpha, mintLight, mintLightAlpha } from './mint';

export const mint = createPalette(mintLight, mintDark);
export const mintAlpha = createPalette(mintLightAlpha, mintDarkAlpha);
