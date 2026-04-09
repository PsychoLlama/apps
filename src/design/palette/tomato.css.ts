import { createPalette } from '../color-scheme';
import {
  tomatoDark,
  tomatoDarkAlpha,
  tomatoLight,
  tomatoLightAlpha,
} from './tomato';

export const tomato = createPalette(tomatoLight, tomatoDark);
export const tomatoAlpha = createPalette(tomatoLightAlpha, tomatoDarkAlpha);
