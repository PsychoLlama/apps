/**
 * Selectors and media queries for color-scheme-aware tokens.
 *
 * Some tokens (like shadows) need structurally different values per
 * mode — not just different colors, but different CSS altogether.
 * These can't use `light-dark()` and must be assigned as CSS custom
 * properties that change with the active color scheme.
 *
 * To avoid duplicate declarations in the CSS inspector, each
 * permutation is targeted by exactly one rule:
 *
 * - No override (`systemSelector`): the system preference decides.
 *   Pair with `lightMedia` / `darkMedia` so only the active scheme
 *   matches.
 * - Explicit override (`lightSelector` / `darkSelector`): the
 *   application has forced a scheme via `data-color-scheme`.
 */

import {
  assignVars,
  createThemeContract,
  createVar,
  globalStyle,
  type GlobalStyleRule,
} from '@vanilla-extract/css';

import type { ColorScale } from './palette/color-palette';

/** Attribute set on `:root` to force a specific color scheme. */
const attr = 'data-color-scheme';

/** Selector for system-managed mode — no application override. */
export const systemSelector = `:root:not([${attr}="light"], [${attr}="dark"])`;

/** Selector for application-forced light mode. */
export const lightSelector = `:root[${attr}="light"]`;

/** Selector for application-forced dark mode. */
export const darkSelector = `:root[${attr}="dark"]`;

/** Media query for system-level light mode preference. */
const lightMedia = '(prefers-color-scheme: light)';

/** Media query for system-level dark mode preference. */
const darkMedia = '(prefers-color-scheme: dark)';

/**
 * Assign CSS custom properties that branch on light/dark mode.
 *
 * Emits the three `globalStyle` rules needed to cover every
 * permutation (system-light, system-dark, forced-light, forced-dark)
 * without duplicate declarations.
 *
 * Only needed when light and dark modes require structurally different
 * CSS (e.g. different shadow geometry). Tokens that differ only in
 * color values should use `light-dark()` instead, which handles theme
 * switching natively without var duplication.
 */
export const assignColorSchemeVars = (
  light: GlobalStyleRule['vars'],
  dark: GlobalStyleRule['vars'],
): void => {
  globalStyle(systemSelector, {
    '@media': {
      [lightMedia]: { vars: light },
      [darkMedia]: { vars: dark },
    },
  });

  globalStyle(darkSelector, { vars: dark });
  globalStyle(lightSelector, { vars: light });
};

/** CSS `light-dark(...)` shorthand. */
export const lightDark = (light: string, dark: string): string =>
  `light-dark(${light}, ${dark})`;

export const colorScaleIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const colorScaleShape = Object.fromEntries(
  colorScaleIds.map((id) => [id, '']),
) as Record<keyof ColorScale, string>;

/** A 1-12 color scale backed by CSS custom properties. */
export type ColorContract = Record<keyof ColorScale, string>;

/**
 * Map one color contract's vars to another's values.
 *
 * Unlike `assignVars`, this works across independently created
 * contracts by matching on the scale key (1-12) rather than
 * requiring structurally identical VE contracts.
 */
export const aliasVars = (
  contract: ColorContract,
  source: ColorContract,
): Record<string, string> => {
  const vars: Record<string, string> = {};
  colorScaleIds.forEach((id) => {
    vars[contract[id]] = source[id];
  });
  return vars;
};

/**
 * Register a 12-step color scale as CSS custom properties on `:root`.
 *
 * Creates a 1-12 theme contract and assigns `light-dark()` values via
 * `globalStyle`. The side effect fires on import — scales that are
 * never imported produce no CSS.
 *
 * Used as a building block for `ColorPalette` in `palette/<color>.css.ts`:
 * ```ts
 * solid: createColorScale(blueLight, blueDark),
 * alpha: createColorScale(blueLightAlpha, blueDarkAlpha),
 * ```
 */
export const createColorScale = (
  light: ColorScale,
  dark: ColorScale,
): ColorContract => {
  const contract = createThemeContract(colorScaleShape);
  const values = structuredClone(colorScaleShape);

  colorScaleIds.forEach((id) => {
    values[id] = lightDark(light[id], dark[id]);
  });

  globalStyle(':root', { vars: assignVars(contract, values) });

  return contract;
};

/**
 * Register a single color value on `:root`. Mode-aware when `dark` is
 * provided, mode-invariant otherwise. Returns a CSS-var ref that
 * resolves to the registered value.
 */
export const createColorVar = (light: string, dark?: string): string => {
  const cssVar = createVar();
  const value = dark === undefined ? light : lightDark(light, dark);
  globalStyle(':root', { vars: { [cssVar]: value } });
  return cssVar;
};

/**
 * Composite of every CSS-var ref a Radix-style color palette exposes.
 *
 * One palette is the unit-of-binding: `setThemeColors({ accent: blue })`
 * swaps every blue token at once instead of forcing a quartet of
 * `accent`/`accentAlpha`/etc. fields.
 *
 * Field semantics mirror Radix Themes' per-color tokens:
 * - `solid`/`alpha` — the 12-step opaque and translucent scales.
 * - `contrast` — legible text color paired with `solid[9]`.
 * - `surface` — translucent panel-ish background, distinct from `solid[2]`.
 * - `indicator` — form-control fill marker (radio dot, checkbox check).
 * - `track` — form-control filled track (slider rail, progress bar).
 */
export interface ColorPalette {
  /** Opaque 12-step scale. */
  solid: ColorContract;
  /** Translucent 12-step companion. */
  alpha: ColorContract;
  /** Legible text color paired with `solid[9]`. */
  contrast: string;
  /** Translucent panel-ish background, distinct from `solid[2]`. */
  surface: string;
  /** Form-control fill marker. Usually aliases `solid[9]`. */
  indicator: string;
  /** Form-control filled-track portion. Usually aliases `solid[9]`. */
  track: string;
}

/**
 * Map a target palette contract's vars to a source palette's values.
 *
 * Used by `setThemeColors` to bind a concrete palette (e.g. `blue`) into
 * a semantic role contract (e.g. `accent`). Copies every facet:
 * solid + alpha scales plus the four meta tokens.
 */
export const aliasPalette = (
  target: ColorPalette,
  source: ColorPalette,
): Record<string, string> => ({
  ...aliasVars(target.solid, source.solid),
  ...aliasVars(target.alpha, source.alpha),
  [target.contrast]: source.contrast,
  [target.surface]: source.surface,
  [target.indicator]: source.indicator,
  [target.track]: source.track,
});
