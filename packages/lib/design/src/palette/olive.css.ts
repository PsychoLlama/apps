import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  oliveContrast,
  oliveDark,
  oliveDarkAlpha,
  oliveDarkSurface,
  oliveLight,
  oliveLightAlpha,
  oliveLightSurface,
} from './olive';

const solid = createColorScale(oliveLight, oliveDark);

export const olive: ColorPalette = {
  solid,
  alpha: createColorScale(oliveLightAlpha, oliveDarkAlpha),
  contrast: createColorVar(oliveContrast),
  surface: createColorVar(oliveLightSurface, oliveDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
