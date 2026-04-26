import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  purpleContrast,
  purpleDark,
  purpleDarkAlpha,
  purpleDarkSurface,
  purpleLight,
  purpleLightAlpha,
  purpleLightSurface,
} from './purple';

const solid = createColorScale(purpleLight, purpleDark);

export const purple: ColorPalette = {
  solid,
  alpha: createColorScale(purpleLightAlpha, purpleDarkAlpha),
  contrast: createColorVar(purpleContrast),
  surface: createColorVar(purpleLightSurface, purpleDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
