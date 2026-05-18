import {
  createColorScale,
  createColorVar,
  type ColorPalette,
} from '../color-scheme';
import { toColorScale } from './color-palette';
import * as lightSrc from './gray/light';
import * as darkSrc from './gray/dark';
import * as lightAlphaSrc from './gray/light-alpha';
import * as darkAlphaSrc from './gray/dark-alpha';
import { contrast } from './gray/contrast';
import * as surface from './gray/surface';

const solid = createColorScale(toColorScale(lightSrc), toColorScale(darkSrc));

export const gray: ColorPalette = {
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
