import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  blueContrast,
  blueDark,
  blueDarkAlpha,
  blueDarkSurface,
  blueLight,
  blueLightAlpha,
  blueLightSurface,
} from './blue';

const solid = createColorScale(blueLight, blueDark);

export const blue: ColorPalette = {
  solid,
  alpha: createColorScale(blueLightAlpha, blueDarkAlpha),
  contrast: createColorVar(blueContrast),
  surface: createColorVar(blueLightSurface, blueDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
