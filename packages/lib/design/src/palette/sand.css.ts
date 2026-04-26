import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  sandContrast,
  sandDark,
  sandDarkAlpha,
  sandDarkSurface,
  sandLight,
  sandLightAlpha,
  sandLightSurface,
} from './sand';

const solid = createColorScale(sandLight, sandDark);

export const sand: ColorPalette = {
  solid,
  alpha: createColorScale(sandLightAlpha, sandDarkAlpha),
  contrast: createColorVar(sandContrast),
  surface: createColorVar(sandLightSurface, sandDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
