import { createPalette } from '../color-scheme';
import { plumDark, plumDarkAlpha, plumLight, plumLightAlpha } from './plum';

export const plum = createPalette(plumLight, plumDark);
export const plumAlpha = createPalette(plumLightAlpha, plumDarkAlpha);
