import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './iris/light';
import * as darkSrc from './iris/dark';
import * as lightAlphaSrc from './iris/light-alpha';
import * as darkAlphaSrc from './iris/dark-alpha';
import { contrast } from './iris/contrast';
import * as surface from './iris/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const iris: ColorPalette = {
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
