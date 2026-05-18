import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './orange/light';
import * as darkSrc from './orange/dark';
import * as lightAlphaSrc from './orange/light-alpha';
import * as darkAlphaSrc from './orange/dark-alpha';
import { contrast } from './orange/contrast';
import * as surface from './orange/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const orange: ColorPalette = {
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
