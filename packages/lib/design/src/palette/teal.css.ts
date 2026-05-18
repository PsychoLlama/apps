import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './teal/light';
import * as darkSrc from './teal/dark';
import * as lightAlphaSrc from './teal/light-alpha';
import * as darkAlphaSrc from './teal/dark-alpha';
import { contrast } from './teal/contrast';
import * as surface from './teal/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const teal: ColorPalette = {
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
