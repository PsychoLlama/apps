import { createPalette } from '../color-scheme';
import { sandDark, sandDarkAlpha, sandLight, sandLightAlpha } from './sand';

export const sand = createPalette(sandLight, sandDark);
export const sandAlpha = createPalette(sandLightAlpha, sandDarkAlpha);
