import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  mintContrast,
  mintDark,
  mintDarkAlpha,
  mintDarkSurface,
  mintLight,
  mintLightAlpha,
  mintLightSurface,
} from './mint';

const solid = createColorScale(mintLight, mintDark);

export const mint: ColorPalette = {
  solid,
  alpha: createColorScale(mintLightAlpha, mintDarkAlpha),
  contrast: createColorVar(mintContrast),
  surface: createColorVar(mintLightSurface, mintDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
