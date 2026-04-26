import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  mauveContrast,
  mauveDark,
  mauveDarkAlpha,
  mauveDarkSurface,
  mauveLight,
  mauveLightAlpha,
  mauveLightSurface,
} from './mauve';

const solid = createColorScale(mauveLight, mauveDark);

export const mauve: ColorPalette = {
  solid,
  alpha: createColorScale(mauveLightAlpha, mauveDarkAlpha),
  contrast: createColorVar(mauveContrast),
  surface: createColorVar(mauveLightSurface, mauveDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
