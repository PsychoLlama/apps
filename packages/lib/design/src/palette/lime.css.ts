import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  limeContrast,
  limeDark,
  limeDarkAlpha,
  limeDarkSurface,
  limeLight,
  limeLightAlpha,
  limeLightSurface,
} from './lime';

const solid = createColorScale(limeLight, limeDark);

export const lime: ColorPalette = {
  solid,
  alpha: createColorScale(limeLightAlpha, limeDarkAlpha),
  contrast: createColorVar(limeContrast),
  surface: createColorVar(limeLightSurface, limeDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
