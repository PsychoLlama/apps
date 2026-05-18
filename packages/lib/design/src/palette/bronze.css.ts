import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './bronze/light';
import * as darkSrc from './bronze/dark';
import * as lightAlphaSrc from './bronze/light-alpha';
import * as darkAlphaSrc from './bronze/dark-alpha';
import { contrast } from './bronze/contrast';
import * as surface from './bronze/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const bronze: ColorPalette = {
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
