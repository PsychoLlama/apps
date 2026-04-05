import '@fontsource-variable/ibm-plex-sans';
import './reset.css';
import {
  accent,
  accentAlpha,
  background,
  neutral,
  neutralAlpha,
  text,
} from './tokens/color.css';
import { fontFamily, fontWeight, typeScale } from './tokens/typography.css';

export { accent, accentAlpha, neutral, neutralAlpha };

export const { lowContrast: textLowContrast, highContrast: textHighContrast } =
  text;

export const {
  page: bgPage,
  panelSolid: bgPanelSolid,
  panelTranslucent: bgPanelTranslucent,
  surface: bgSurface,
  overlay: bgOverlay,
} = background;

export { fontFamily, fontWeight, typeScale };
