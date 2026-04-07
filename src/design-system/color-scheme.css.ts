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

/** Attribute set on `:root` to force a specific color scheme. */
const attr = 'data-color-scheme';

/** Selector for system-managed mode — no application override. */
export const systemSelector = `:root:not([${attr}])`;

/** Selector for application-forced light mode. */
export const lightSelector = `:root[${attr}="light"]`;

/** Selector for application-forced dark mode. */
export const darkSelector = `:root[${attr}="dark"]`;

/** Media query for system-level light mode preference. */
export const lightMedia = '(prefers-color-scheme: light)';

/** Media query for system-level dark mode preference. */
export const darkMedia = '(prefers-color-scheme: dark)';
