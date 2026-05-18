import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './cyan/light';
import * as darkSrc from './cyan/dark';
import * as lightAlphaSrc from './cyan/light-alpha';
import * as darkAlphaSrc from './cyan/dark-alpha';
import { contrast } from './cyan/contrast';
import * as surface from './cyan/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const cyan: ColorPalette = {
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
