import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  pinkContrast,
  pinkDark,
  pinkDarkAlpha,
  pinkDarkSurface,
  pinkLight,
  pinkLightAlpha,
  pinkLightSurface,
} from './pink';

const solid = createColorScale(pinkLight, pinkDark);

export const pink: ColorPalette = {
  solid,
  alpha: createColorScale(pinkLightAlpha, pinkDarkAlpha),
  contrast: createColorVar(pinkContrast),
  surface: createColorVar(pinkLightSurface, pinkDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
