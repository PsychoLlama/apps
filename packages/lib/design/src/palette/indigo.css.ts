import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  indigoContrast,
  indigoDark,
  indigoDarkAlpha,
  indigoDarkSurface,
  indigoLight,
  indigoLightAlpha,
  indigoLightSurface,
} from './indigo';

const solid = createColorScale(indigoLight, indigoDark);

export const indigo: ColorPalette = {
  solid,
  alpha: createColorScale(indigoLightAlpha, indigoDarkAlpha),
  contrast: createColorVar(indigoContrast),
  surface: createColorVar(indigoLightSurface, indigoDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
