/**
 * 1-12 scale of a single hue from Radix UI's color palette.
 * Each hue has a light, dark, light+alpha, and dark+alpha scale.
 *
 * The public shape consumers see (e.g. `palette.solid[9]`). Source
 * data lives in `ColorStepScale`-shaped files and is renamed into this
 * shape inside `palette/<hue>.css.ts`.
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

/**
 * Authoring shape for the raw scale data in `palette/<hue>/<variant>.ts`.
 *
 * Each step is a separate named export so a runtime consumer can pull
 * one value (e.g. `import { step9 } from '@lib/design/color/iris/light'`)
 * without dragging the rest of the scale into its bundle — used by the
 * theme prelude and other size-sensitive entries. Renamed into
 * `ColorScale` via `toColorScale` for the public palette API.
 */
export interface ColorStepScale {
  // Backgrounds
  step1: string;
  step2: string;

  // Interactive Components
  step3: string;
  step4: string;
  step5: string;

  // Borders & Separators
  step6: string;
  step7: string;
  step8: string;

  // Solid Colors
  step9: string;
  step10: string;

  // Accessible Text
  step11: string;
  step12: string;
}

/**
 * Rename a `ColorStepScale` (`step1`...`step12`) into a `ColorScale`
 * (numeric keys `1`...`12`). Used in `palette/<hue>.css.ts` to bridge
 * the per-file source shape into the public scale shape.
 */
export const toColorScale = (scale: ColorStepScale): ColorScale => ({
  1: scale.step1,
  2: scale.step2,
  3: scale.step3,
  4: scale.step4,
  5: scale.step5,
  6: scale.step6,
  7: scale.step7,
  8: scale.step8,
  9: scale.step9,
  10: scale.step10,
  11: scale.step11,
  12: scale.step12,
});
