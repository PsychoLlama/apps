import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import {
  bronzeContrast,
  bronzeDark,
  bronzeDarkAlpha,
  bronzeDarkSurface,
  bronzeLight,
  bronzeLightAlpha,
  bronzeLightSurface,
} from './bronze';

const solid = createColorScale(bronzeLight, bronzeDark);

export const bronze: ColorPalette = {
  solid,
  alpha: createColorScale(bronzeLightAlpha, bronzeDarkAlpha),
  contrast: createColorVar(bronzeContrast),
  surface: createColorVar(bronzeLightSurface, bronzeDarkSurface),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
