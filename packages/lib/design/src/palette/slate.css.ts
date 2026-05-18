import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './slate/light';
import * as darkSrc from './slate/dark';
import * as lightAlphaSrc from './slate/light-alpha';
import * as darkAlphaSrc from './slate/dark-alpha';
import { contrast } from './slate/contrast';
import * as surface from './slate/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const slate: ColorPalette = {
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
