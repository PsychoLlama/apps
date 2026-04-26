import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  irisContrast,
  irisDark,
  irisDarkAlpha,
  irisDarkSurface,
  irisLight,
  irisLightAlpha,
  irisLightSurface,
} from './iris';

const solid = createColorScale(irisLight, irisDark);

export const iris: ColorPalette = {
  solid,
  alpha: createColorScale(irisLightAlpha, irisDarkAlpha),
  contrast: createColorVar(irisContrast),
  surface: createColorVar(irisLightSurface, irisDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
