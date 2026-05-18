import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './plum/light';
import * as darkSrc from './plum/dark';
import * as lightAlphaSrc from './plum/light-alpha';
import * as darkAlphaSrc from './plum/dark-alpha';
import { contrast } from './plum/contrast';
import * as surface from './plum/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const plum: ColorPalette = {
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
