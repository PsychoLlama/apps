import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './pink/light';
import * as darkSrc from './pink/dark';
import * as lightAlphaSrc from './pink/light-alpha';
import * as darkAlphaSrc from './pink/dark-alpha';
import { contrast } from './pink/contrast';
import * as surface from './pink/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const pink: ColorPalette = {
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
