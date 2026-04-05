import { createThemeContract } from '@vanilla-extract/css';

export const textContract = createThemeContract({
  /** Low-contrast text (neutral step 11). */
  lowContrast: null,
  /** High-contrast text (neutral step 12). */
  highContrast: null,
});
