import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './sand/light';
import * as darkSrc from './sand/dark';
import * as lightAlphaSrc from './sand/light-alpha';
import * as darkAlphaSrc from './sand/dark-alpha';
import { contrast } from './sand/contrast';
import * as surface from './sand/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const sand: ColorPalette = {
  solid,
  alpha: createColorScale(
    toColorScale(lightAlphaSrc),
    toColorScale(darkAlphaSrc),
  ),
  contrast: createColorVar(contrast),
  surface: createColorVar(surface.light, surface.dark),
  indicator: createColorVar(solid[9]),
  track: createColorVar(solid[9]),
};
