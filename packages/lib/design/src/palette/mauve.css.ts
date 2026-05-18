import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './mauve/light';
import * as darkSrc from './mauve/dark';
import * as lightAlphaSrc from './mauve/light-alpha';
import * as darkAlphaSrc from './mauve/dark-alpha';
import { contrast } from './mauve/contrast';
import * as surface from './mauve/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const mauve: ColorPalette = {
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
