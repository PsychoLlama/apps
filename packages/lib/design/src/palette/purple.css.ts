import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './purple/light';
import * as darkSrc from './purple/dark';
import * as lightAlphaSrc from './purple/light-alpha';
import * as darkAlphaSrc from './purple/dark-alpha';
import { contrast } from './purple/contrast';
import * as surface from './purple/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const purple: ColorPalette = {
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
