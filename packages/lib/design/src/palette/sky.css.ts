import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  skyContrast,
  skyDark,
  skyDarkAlpha,
  skyDarkSurface,
  skyLight,
  skyLightAlpha,
  skyLightSurface,
} from './sky';

const solid = createColorScale(skyLight, skyDark);

export const sky: ColorPalette = {
  solid,
  alpha: createColorScale(skyLightAlpha, skyDarkAlpha),
  contrast: createColorVar(skyContrast),
  surface: createColorVar(skyLightSurface, skyDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
