import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './blue/light';
import * as darkSrc from './blue/dark';
import * as lightAlphaSrc from './blue/light-alpha';
import * as darkAlphaSrc from './blue/dark-alpha';
import { contrast } from './blue/contrast';
import * as surface from './blue/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const blue: ColorPalette = {
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
