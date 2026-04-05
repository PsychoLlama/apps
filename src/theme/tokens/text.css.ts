import { createThemeContract } from '@vanilla-extract/css';

// See: https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale
export const textContract = createThemeContract({
  /** Low-contrast text (neutral step 11). */
  lowContrast: null,
  /** High-contrast text (neutral step 12). */
  highContrast: null,
});
