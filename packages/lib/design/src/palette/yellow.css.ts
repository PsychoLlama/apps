import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './yellow/light';
import * as darkSrc from './yellow/dark';
import * as lightAlphaSrc from './yellow/light-alpha';
import * as darkAlphaSrc from './yellow/dark-alpha';
import { contrast } from './yellow/contrast';
import * as surface from './yellow/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const yellow: ColorPalette = {
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
