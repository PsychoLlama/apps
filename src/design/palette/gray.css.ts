import { createPalette } from '../color-scheme';
import { grayDark, grayDarkAlpha, grayLight, grayLightAlpha } from './gray';

export const gray = createPalette(grayLight, grayDark);
export const grayAlpha = createPalette(grayLightAlpha, grayDarkAlpha);
