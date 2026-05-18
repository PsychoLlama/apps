import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './indigo/light';
import * as darkSrc from './indigo/dark';
import * as lightAlphaSrc from './indigo/light-alpha';
import * as darkAlphaSrc from './indigo/dark-alpha';
import { contrast } from './indigo/contrast';
import * as surface from './indigo/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const indigo: ColorPalette = {
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
