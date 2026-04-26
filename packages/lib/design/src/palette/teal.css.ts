import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  tealContrast,
  tealDark,
  tealDarkAlpha,
  tealDarkSurface,
  tealLight,
  tealLightAlpha,
  tealLightSurface,
} from './teal';

const solid = createColorScale(tealLight, tealDark);

export const teal: ColorPalette = {
  solid,
  alpha: createColorScale(tealLightAlpha, tealDarkAlpha),
  contrast: createColorVar(tealContrast),
  surface: createColorVar(tealLightSurface, tealDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
