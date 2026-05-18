import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './sky/light';
import * as darkSrc from './sky/dark';
import * as lightAlphaSrc from './sky/light-alpha';
import * as darkAlphaSrc from './sky/dark-alpha';
import { contrast } from './sky/contrast';
import * as surface from './sky/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const sky: ColorPalette = {
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
