import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  redContrast,
  redDark,
  redDarkAlpha,
  redDarkSurface,
  redLight,
  redLightAlpha,
  redLightSurface,
} from './red';

const solid = createColorScale(redLight, redDark);

export const red: ColorPalette = {
  solid,
  alpha: createColorScale(redLightAlpha, redDarkAlpha),
  contrast: createColorVar(redContrast),
  surface: createColorVar(redLightSurface, redDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
