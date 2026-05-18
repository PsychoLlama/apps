import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './grass/light';
import * as darkSrc from './grass/dark';
import * as lightAlphaSrc from './grass/light-alpha';
import * as darkAlphaSrc from './grass/dark-alpha';
import { contrast } from './grass/contrast';
import * as surface from './grass/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const grass: ColorPalette = {
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
