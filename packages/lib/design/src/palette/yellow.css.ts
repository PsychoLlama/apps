import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  yellowContrast,
  yellowDark,
  yellowDarkAlpha,
  yellowDarkSurface,
  yellowLight,
  yellowLightAlpha,
  yellowLightSurface,
} from './yellow';

const solid = createColorScale(yellowLight, yellowDark);

export const yellow: ColorPalette = {
  solid,
  alpha: createColorScale(yellowLightAlpha, yellowDarkAlpha),
  contrast: createColorVar(yellowContrast),
  surface: createColorVar(yellowLightSurface, yellowDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
