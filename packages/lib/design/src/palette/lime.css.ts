import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './lime/light';
import * as darkSrc from './lime/dark';
import * as lightAlphaSrc from './lime/light-alpha';
import * as darkAlphaSrc from './lime/dark-alpha';
import { contrast } from './lime/contrast';
import * as surface from './lime/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const lime: ColorPalette = {
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
