import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  grassContrast,
  grassDark,
  grassDarkAlpha,
  grassDarkSurface,
  grassLight,
  grassLightAlpha,
  grassLightSurface,
} from './grass';

const solid = createColorScale(grassLight, grassDark);

export const grass: ColorPalette = {
  solid,
  alpha: createColorScale(grassLightAlpha, grassDarkAlpha),
  contrast: createColorVar(grassContrast),
  surface: createColorVar(grassLightSurface, grassDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
