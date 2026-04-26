import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  grayContrast,
  grayDark,
  grayDarkAlpha,
  grayDarkSurface,
  grayLight,
  grayLightAlpha,
  grayLightSurface,
} from './gray';

const solid = createColorScale(grayLight, grayDark);

export const gray: ColorPalette = {
  solid,
  alpha: createColorScale(grayLightAlpha, grayDarkAlpha),
  contrast: createColorVar(grayContrast),
  surface: createColorVar(grayLightSurface, grayDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
