import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './violet/light';
import * as darkSrc from './violet/dark';
import * as lightAlphaSrc from './violet/light-alpha';
import * as darkAlphaSrc from './violet/dark-alpha';
import { contrast } from './violet/contrast';
import * as surface from './violet/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const violet: ColorPalette = {
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
