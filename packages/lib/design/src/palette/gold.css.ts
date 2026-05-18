import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './gold/light';
import * as darkSrc from './gold/dark';
import * as lightAlphaSrc from './gold/light-alpha';
import * as darkAlphaSrc from './gold/dark-alpha';
import { contrast } from './gold/contrast';
import * as surface from './gold/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const gold: ColorPalette = {
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
