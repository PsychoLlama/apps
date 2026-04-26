import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  orangeContrast,
  orangeDark,
  orangeDarkAlpha,
  orangeDarkSurface,
  orangeLight,
  orangeLightAlpha,
  orangeLightSurface,
} from './orange';

const solid = createColorScale(orangeLight, orangeDark);

export const orange: ColorPalette = {
  solid,
  alpha: createColorScale(orangeLightAlpha, orangeDarkAlpha),
  contrast: createColorVar(orangeContrast),
  surface: createColorVar(orangeLightSurface, orangeDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
