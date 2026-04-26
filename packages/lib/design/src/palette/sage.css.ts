import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  sageContrast,
  sageDark,
  sageDarkAlpha,
  sageDarkSurface,
  sageLight,
  sageLightAlpha,
  sageLightSurface,
} from './sage';

const solid = createColorScale(sageLight, sageDark);

export const sage: ColorPalette = {
  solid,
  alpha: createColorScale(sageLightAlpha, sageDarkAlpha),
  contrast: createColorVar(sageContrast),
  surface: createColorVar(sageLightSurface, sageDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
