import { createPalette } from '../color-scheme';
import { rubyDark, rubyDarkAlpha, rubyLight, rubyLightAlpha } from './ruby';

export const ruby = createPalette(rubyLight, rubyDark);
export const rubyAlpha = createPalette(rubyLightAlpha, rubyDarkAlpha);
