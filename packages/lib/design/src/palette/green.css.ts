import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  greenContrast,
  greenDark,
  greenDarkAlpha,
  greenDarkSurface,
  greenLight,
  greenLightAlpha,
  greenLightSurface,
} from './green';

const solid = createColorScale(greenLight, greenDark);

export const green: ColorPalette = {
  solid,
  alpha: createColorScale(greenLightAlpha, greenDarkAlpha),
  contrast: createColorVar(greenContrast),
  surface: createColorVar(greenLightSurface, greenDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
