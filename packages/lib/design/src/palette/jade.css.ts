import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  jadeContrast,
  jadeDark,
  jadeDarkAlpha,
  jadeDarkSurface,
  jadeLight,
  jadeLightAlpha,
  jadeLightSurface,
} from './jade';

const solid = createColorScale(jadeLight, jadeDark);

export const jade: ColorPalette = {
  solid,
  alpha: createColorScale(jadeLightAlpha, jadeDarkAlpha),
  contrast: createColorVar(jadeContrast),
  surface: createColorVar(jadeLightSurface, jadeDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
