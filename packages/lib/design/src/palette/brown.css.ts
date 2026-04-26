import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  brownContrast,
  brownDark,
  brownDarkAlpha,
  brownDarkSurface,
  brownLight,
  brownLightAlpha,
  brownLightSurface,
} from './brown';

const solid = createColorScale(brownLight, brownDark);

export const brown: ColorPalette = {
  solid,
  alpha: createColorScale(brownLightAlpha, brownDarkAlpha),
  contrast: createColorVar(brownContrast),
  surface: createColorVar(brownLightSurface, brownDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
