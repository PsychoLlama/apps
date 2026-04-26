import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  slateContrast,
  slateDark,
  slateDarkAlpha,
  slateDarkSurface,
  slateLight,
  slateLightAlpha,
  slateLightSurface,
} from './slate';

const solid = createColorScale(slateLight, slateDark);

export const slate: ColorPalette = {
  solid,
  alpha: createColorScale(slateLightAlpha, slateDarkAlpha),
  contrast: createColorVar(slateContrast),
  surface: createColorVar(slateLightSurface, slateDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
