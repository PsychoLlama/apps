import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  tomatoContrast,
  tomatoDark,
  tomatoDarkAlpha,
  tomatoDarkSurface,
  tomatoLight,
  tomatoLightAlpha,
  tomatoLightSurface,
} from './tomato';

const solid = createColorScale(tomatoLight, tomatoDark);

export const tomato: ColorPalette = {
  solid,
  alpha: createColorScale(tomatoLightAlpha, tomatoDarkAlpha),
  contrast: createColorVar(tomatoContrast),
  surface: createColorVar(tomatoLightSurface, tomatoDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
