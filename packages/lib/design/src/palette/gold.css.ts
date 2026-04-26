import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  goldContrast,
  goldDark,
  goldDarkAlpha,
  goldDarkSurface,
  goldLight,
  goldLightAlpha,
  goldLightSurface,
} from './gold';

const solid = createColorScale(goldLight, goldDark);

export const gold: ColorPalette = {
  solid,
  alpha: createColorScale(goldLightAlpha, goldDarkAlpha),
  contrast: createColorVar(goldContrast),
  surface: createColorVar(goldLightSurface, goldDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
