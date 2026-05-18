import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './crimson/light';
import * as darkSrc from './crimson/dark';
import * as lightAlphaSrc from './crimson/light-alpha';
import * as darkAlphaSrc from './crimson/dark-alpha';
import { contrast } from './crimson/contrast';
import * as surface from './crimson/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const crimson: ColorPalette = {
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
