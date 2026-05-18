import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './mint/light';
import * as darkSrc from './mint/dark';
import * as lightAlphaSrc from './mint/light-alpha';
import * as darkAlphaSrc from './mint/dark-alpha';
import { contrast } from './mint/contrast';
import * as surface from './mint/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const mint: ColorPalette = {
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
