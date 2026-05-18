import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './green/light';
import * as darkSrc from './green/dark';
import * as lightAlphaSrc from './green/light-alpha';
import * as darkAlphaSrc from './green/dark-alpha';
import { contrast } from './green/contrast';
import * as surface from './green/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const green: ColorPalette = {
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
