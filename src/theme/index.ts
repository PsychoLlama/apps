// Side effect: apply theme globals.
import {
  backgroundContract,
  colorContract,
  textContract,
} from './theme-globals.css';

export const { accent, accentAlpha, neutral, neutralAlpha } = colorContract;
export const { lowContrast: textLowContrast, highContrast: textHighContrast } =
  textContract;

export const {
  page: bgPage,
  panelSolid: bgPanelSolid,
  panelTranslucent: bgPanelTranslucent,
  surface: bgSurface,
  overlay: bgOverlay,
} = backgroundContract;
