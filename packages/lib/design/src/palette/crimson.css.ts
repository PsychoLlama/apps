import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  crimsonContrast,
  crimsonDark,
  crimsonDarkAlpha,
  crimsonDarkSurface,
  crimsonLight,
  crimsonLightAlpha,
  crimsonLightSurface,
} from './crimson';

const solid = createColorScale(crimsonLight, crimsonDark);

export const crimson: ColorPalette = {
  solid,
  alpha: createColorScale(crimsonLightAlpha, crimsonDarkAlpha),
  contrast: createColorVar(crimsonContrast),
  surface: createColorVar(crimsonLightSurface, crimsonDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
