import { createPalette } from '../color-scheme';
import { jadeDark, jadeDarkAlpha, jadeLight, jadeLightAlpha } from './jade';

export const jade = createPalette(jadeLight, jadeDark);
export const jadeAlpha = createPalette(jadeLightAlpha, jadeDarkAlpha);
