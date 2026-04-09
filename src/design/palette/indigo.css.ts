import { createPalette } from '../color-scheme';
import {
  indigoDark,
  indigoDarkAlpha,
  indigoLight,
  indigoLightAlpha,
} from './indigo';

export const indigo = createPalette(indigoLight, indigoDark);
export const indigoAlpha = createPalette(indigoLightAlpha, indigoDarkAlpha);
