import { createThemeContract } from '@vanilla-extract/css';

export const surfaceLight = 'rgba(255, 255, 255, 0.85)';
export const overlayLight = 'rgba(0, 0, 0, 0.38)';

export const surfaceDark = 'rgba(0, 0, 0, 0.25)';
export const overlayDark = 'rgba(0, 0, 0, 0.6)';

export const backgroundContract = createThemeContract({
  /** App canvas. The lowest layer, applied to the page body. */
  page: null,

  /** Opaque elevated containers: cards, dialogs, popovers, sidebars. */
  panelSolid: null,

  /** Semi-transparent elevated containers. Pair with `backdrop-filter: blur(64px)` for frosted glass. */
  panelTranslucent: null,

  /** Recessed interactive surfaces: text inputs, selects, unchecked checkboxes/radios. */
  surface: null,

  /** Modal scrim behind dialogs and drawers. */
  overlay: null,
});
