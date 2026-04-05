import { createThemeContract } from '@vanilla-extract/css';

import type { ColorScale } from '../palette/color-palette';

const scale: Record<keyof ColorScale, null> = {
  1: null,
  2: null,
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
  9: null,
  10: null,
  11: null,
  12: null,
} as const;

export const colorContract = createThemeContract({
  /** Brand color. There is no secondary/tertiary. */
  accent: scale,

  /** Semi-transparent variants of the accent. */
  accentAlpha: scale,

  /** Grayscale, partially tinted to match accent. */
  gray: scale,

  /** Semi-transparent grayscale variants. */
  grayAlpha: scale,
});
