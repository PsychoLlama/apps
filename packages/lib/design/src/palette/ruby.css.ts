import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  rubyContrast,
  rubyDark,
  rubyDarkAlpha,
  rubyDarkSurface,
  rubyLight,
  rubyLightAlpha,
  rubyLightSurface,
} from './ruby';

const solid = createColorScale(rubyLight, rubyDark);

export const ruby: ColorPalette = {
  solid,
  alpha: createColorScale(rubyLightAlpha, rubyDarkAlpha),
  contrast: createColorVar(rubyContrast),
  surface: createColorVar(rubyLightSurface, rubyDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
