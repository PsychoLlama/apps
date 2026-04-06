/**
 * Shared selectors and media queries for color-scheme-aware tokens.
 *
 * Used by `color.css.ts` (which sets `colorScheme` on the root for
 * `light-dark()` tokens) and `shadow.css.ts` (which assigns
 * structurally different shadow values per mode).
 */

/** Attribute set on `:root` to force a specific color scheme. */
const attr = 'data-color-scheme';

/** Selector for application-forced light mode. */
export const lightSelector = `:root[${attr}="light"]`;

/** Selector for application-forced dark mode. */
export const darkSelector = `:root[${attr}="dark"]`;

/** Media query for system-level dark mode preference. */
export const darkMedia = '(prefers-color-scheme: dark)';
