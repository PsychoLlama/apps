import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './sage/light';
import * as darkSrc from './sage/dark';
import * as lightAlphaSrc from './sage/light-alpha';
import * as darkAlphaSrc from './sage/dark-alpha';
import { contrast } from './sage/contrast';
import * as surface from './sage/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const sage: ColorPalette = {
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
