import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  plumContrast,
  plumDark,
  plumDarkAlpha,
  plumDarkSurface,
  plumLight,
  plumLightAlpha,
  plumLightSurface,
} from './plum';

const solid = createColorScale(plumLight, plumDark);

export const plum: ColorPalette = {
  solid,
  alpha: createColorScale(plumLightAlpha, plumDarkAlpha),
  contrast: createColorVar(plumContrast),
  surface: createColorVar(plumLightSurface, plumDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
