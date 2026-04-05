// Side effect: apply theme globals.
import { colorContract, textContract } from './theme-globals.css';

export const { accent, accentAlpha, neutral, neutralAlpha } = colorContract;
export const { lowContrast: textLowContrast, highContrast: textHighContrast } =
  textContract;
