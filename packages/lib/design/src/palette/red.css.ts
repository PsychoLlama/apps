import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './red/light';
import * as darkSrc from './red/dark';
import * as lightAlphaSrc from './red/light-alpha';
import * as darkAlphaSrc from './red/dark-alpha';
import { contrast } from './red/contrast';
import * as surface from './red/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const red: ColorPalette = {
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
