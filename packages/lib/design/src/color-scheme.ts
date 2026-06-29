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

/**
 * Attribute that forces a specific color scheme. Set on `:root` for a
 * document-wide override, or on any element to override a subtree —
 * both the `light-dark()` colors and the structurally-different vars
 * (`assignColorSchemeVars`) flip together, since custom properties and
 * the `color-scheme` property both inherit.
 */
const attr = 'data-color-scheme';

/**
 * Selector for system-managed mode — no application override.
 *
 * Stays anchored to `:root`: "system" is a document-level default, and
 * per-subtree *reversion* to system (an override inside an override)
 * isn't a supported case. Un-anchoring would degrade this to a
 * near-universal `:not()` that re-declares the media-driven vars on
 * every element — the exact cost we avoid.
 */
export const systemSelector = `:root:not([${attr}="light"], [${attr}="dark"])`;

/**
 * Selector for forced light mode, at any depth. Unanchored so a subtree
 * can override the document scheme; `systemSelector`'s `:not` excludes
 * any element carrying the attribute, so system and the override never
 * arbitrate against each other.
 */
export const lightSelector = `[${attr}="light"]`;

/** Selector for forced dark mode, at any depth. See `lightSelector`. */
export const darkSelector = `[${attr}="dark"]`;

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
 * One palette is the unit-of-binding: a variant declares `accent: blue`
 * and `setThemeVariants` swaps every blue token at once instead of
 * forcing a quartet of `accent`/`accentAlpha`/etc. fields.
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
 * Used by `setThemeVariants` to bind a concrete palette (e.g. `blue`)
 * into a semantic role contract (e.g. `accent`). Copies every facet:
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
