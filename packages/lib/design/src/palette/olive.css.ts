import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './olive/light';
import * as darkSrc from './olive/dark';
import * as lightAlphaSrc from './olive/light-alpha';
import * as darkAlphaSrc from './olive/dark-alpha';
import { contrast } from './olive/contrast';
import * as surface from './olive/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const olive: ColorPalette = {
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
