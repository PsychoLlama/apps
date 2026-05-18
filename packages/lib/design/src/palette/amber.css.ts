import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './amber/light';
import * as darkSrc from './amber/dark';
import * as lightAlphaSrc from './amber/light-alpha';
import * as darkAlphaSrc from './amber/dark-alpha';
import { contrast } from './amber/contrast';
import * as surface from './amber/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const amber: ColorPalette = {
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
