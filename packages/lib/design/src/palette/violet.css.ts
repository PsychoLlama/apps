import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  violetContrast,
  violetDark,
  violetDarkAlpha,
  violetDarkSurface,
  violetLight,
  violetLightAlpha,
  violetLightSurface,
} from './violet';

const solid = createColorScale(violetLight, violetDark);

export const violet: ColorPalette = {
  solid,
  alpha: createColorScale(violetLightAlpha, violetDarkAlpha),
  contrast: createColorVar(violetContrast),
  surface: createColorVar(violetLightSurface, violetDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
