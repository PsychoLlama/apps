import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  cyanContrast,
  cyanDark,
  cyanDarkAlpha,
  cyanDarkSurface,
  cyanLight,
  cyanLightAlpha,
  cyanLightSurface,
} from './cyan';

const solid = createColorScale(cyanLight, cyanDark);

export const cyan: ColorPalette = {
  solid,
  alpha: createColorScale(cyanLightAlpha, cyanDarkAlpha),
  contrast: createColorVar(cyanContrast),
  surface: createColorVar(cyanLightSurface, cyanDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
