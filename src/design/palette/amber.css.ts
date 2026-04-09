import { createPalette } from '../color-scheme';
import {
  amberDark,
  amberDarkAlpha,
  amberLight,
  amberLightAlpha,
} from './amber';

export const amber = createPalette(amberLight, amberDark);
export const amberAlpha = createPalette(amberLightAlpha, amberDarkAlpha);
