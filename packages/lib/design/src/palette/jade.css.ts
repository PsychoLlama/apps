import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './jade/light';
import * as darkSrc from './jade/dark';
import * as lightAlphaSrc from './jade/light-alpha';
import * as darkAlphaSrc from './jade/dark-alpha';
import { contrast } from './jade/contrast';
import * as surface from './jade/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const jade: ColorPalette = {
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
