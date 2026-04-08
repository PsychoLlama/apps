/**
 * 1-12 scale of a single hue from Radix UI's color palette.
 * Each hue has a light, dark, light+alpha, and dark+alpha scale.
 *
 * See: https://www.radix-ui.com/colors
 */
export interface ColorScale {
  // Backgrounds
  [1]: string;
  [2]: string;

  // Interactive Components
  [3]: string;
  [4]: string;
  [5]: string;

  // Borders & Separators
  [6]: string;
  [7]: string;
  [8]: string;

  // Solid Colors
  [9]: string;
  [10]: string;

  // Accessible Text
  [11]: string;
  [12]: string;
}
