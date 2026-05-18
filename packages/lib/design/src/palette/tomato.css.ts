import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './tomato/light';
import * as darkSrc from './tomato/dark';
import * as lightAlphaSrc from './tomato/light-alpha';
import * as darkAlphaSrc from './tomato/dark-alpha';
import { contrast } from './tomato/contrast';
import * as surface from './tomato/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const tomato: ColorPalette = {
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
