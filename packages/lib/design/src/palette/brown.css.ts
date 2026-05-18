import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './brown/light';
import * as darkSrc from './brown/dark';
import * as lightAlphaSrc from './brown/light-alpha';
import * as darkAlphaSrc from './brown/dark-alpha';
import { contrast } from './brown/contrast';
import * as surface from './brown/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const brown: ColorPalette = {
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
