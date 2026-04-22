import { createPalette } from '../color-scheme';
import {
  greenDark,
  greenDarkAlpha,
  greenLight,
  greenLightAlpha,
} from './green';

export const green = createPalette(greenLight, greenDark);
export const greenAlpha = createPalette(greenLightAlpha, greenDarkAlpha);
