import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  amberContrast,
  amberDark,
  amberDarkAlpha,
  amberDarkSurface,
  amberLight,
  amberLightAlpha,
  amberLightSurface,
} from './amber';

const solid = createColorScale(amberLight, amberDark);

export const amber: ColorPalette = {
  solid,
  alpha: createColorScale(amberLightAlpha, amberDarkAlpha),
  contrast: createColorVar(amberContrast),
  surface: createColorVar(amberLightSurface, amberDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
