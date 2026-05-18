import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './ruby/light';
import * as darkSrc from './ruby/dark';
import * as lightAlphaSrc from './ruby/light-alpha';
import * as darkAlphaSrc from './ruby/dark-alpha';
import { contrast } from './ruby/contrast';
import * as surface from './ruby/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const ruby: ColorPalette = {
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
