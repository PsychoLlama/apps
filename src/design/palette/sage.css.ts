import { createPalette } from '../color-scheme';
import { sageDark, sageDarkAlpha, sageLight, sageLightAlpha } from './sage';

export const sage = createPalette(sageLight, sageDark);
export const sageAlpha = createPalette(sageLightAlpha, sageDarkAlpha);
