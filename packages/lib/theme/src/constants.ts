/**
 * Pure data describing the theme system. Free of CSS side effects so
 * head-script preludes and other ahead-of-paint code can import the
 * canonical list without dragging the Vanilla Extract bundle into a
 * non-Vite build pipeline.
 *
 * `./bundles.css` consumes these to register CSS rules and exposes the
 * labelled `THEMES` list for picker UIs.
 */

import { step1 as mauveDark } from '@lib/design/color/mauve/dark';
import { step1 as mauveLight } from '@lib/design/color/mauve/light';
import { step1 as sageDark } from '@lib/design/color/sage/dark';
import { step1 as sageLight } from '@lib/design/color/sage/light';
import { step1 as sandDark } from '@lib/design/color/sand/dark';
import { step1 as sandLight } from '@lib/design/color/sand/light';
import { step1 as slateDark } from '@lib/design/color/slate/dark';
import { step1 as slateLight } from '@lib/design/color/slate/light';

/**
 * `dataset` key on `<html>` that selects the active theme. The matching
 * `:root[data-theme="<id>"]` rule emitted by the bundle wins by
 * specificity. Shared so the CSS selector, server stamp, prelude, and
 * storybook preview stay in lockstep — use as `dataset[THEME_ATTRIBUTE]`
 * in JS and pair with the `data-` prefix in CSS selectors.
 */
export const THEME_ATTRIBUTE = 'theme';

/**
 * Canonical list of built-in theme ids. Source of truth for theme
 * coverage — `bundles.css` types its variants object against this so
 * adding or removing an id without a matching CSS rule fails to
 * compile.
 */
export const THEME_IDS = [
  'blue',
  'brown',
  'cyan',
  'indigo',
  'iris',
  'jade',
  'orange',
  'pink',
  'plum',
  'purple',
  'sky',
  'teal',
  'violet',
] as const;

/** Identifier for a built-in theme. */
export type ThemeId = (typeof THEME_IDS)[number];

/**
 * Theme rendered when nothing else is selected. The server entry
 * stamps this onto `<html>` so the DOM never reaches the browser
 * with zero (or multiple) themes active.
 */
export const DEFAULT_THEME_ID: ThemeId = 'blue';

/**
 * `localStorage` key holding the user's selected theme id. The head
 * prelude reads this before paint to restamp `<html data-theme>`; the
 * settings picker writes it when the selection changes. Namespaced
 * under `preferences.appearance.*` so future siblings (light/dark
 * mode, motion, density) slot in alongside it.
 */
export const THEME_STORAGE_KEY = 'preferences.appearance.theme';

/**
 * `dataset` key on `<html>` that forces a specific color scheme. Mirrors
 * the attribute name `@lib/design/color-scheme` keys its selectors off
 * of — keep the two in lockstep so the prelude, runtime, and CSS all
 * agree on where the override lives. Absent attribute means
 * "system-managed."
 */
export const COLOR_SCHEME_ATTRIBUTE = 'colorScheme';

/**
 * Canonical list of explicit color-scheme overrides. "system" is not
 * here — it's represented by the absence of `<html data-color-scheme>`,
 * which lets `@media (prefers-color-scheme)` rules take over.
 */
export const COLOR_SCHEME_IDS = ['light', 'dark'] as const;

/** Identifier for an application-forced color scheme. */
export type ColorSchemeId = (typeof COLOR_SCHEME_IDS)[number];

/**
 * Selectable value in the appearance picker. `'system'` is the
 * no-override state — the store and picker share this shape so the
 * radio group can bind directly without translation.
 */
export type ColorSchemeOption = ColorSchemeId | 'system';

/**
 * `localStorage` key holding the user's color-scheme override. Stored
 * value is a `ColorSchemeId`; `'system'` is represented by the key's
 * absence, matching the DOM convention. The head prelude reads this
 * before paint to restamp `<html data-color-scheme>`.
 */
export const COLOR_SCHEME_STORAGE_KEY = 'preferences.appearance.mode';

/**
 * `id` attribute on the per-scheme `theme-color` meta tags. The prelude
 * looks these up to swap `content` to the active theme's page background
 * before paint. Kept here so the server stamp and prelude can't drift.
 */
export const THEME_COLOR_META_ID = {
  light: 'theme-color-light',
  dark: 'theme-color-dark',
} as const;

/**
 * Browser-chrome color per theme: step 1 of the variant's neutral
 * palette (the resolved value of `background.page`). Sourced from the
 * per-step exports under `@lib/design/color/<hue>/{light,dark}` so the
 * inlined prelude bundle only carries the single hex value it actually
 * reads — not the full 12-step scale.
 *
 * Must stay in lockstep with the `neutral` assignments in `bundles.css`.
 */
export const THEME_COLORS: Record<ThemeId, { light: string; dark: string }> = {
  blue: { light: slateLight, dark: slateDark },
  brown: { light: sandLight, dark: sandDark },
  cyan: { light: slateLight, dark: slateDark },
  indigo: { light: slateLight, dark: slateDark },
  iris: { light: slateLight, dark: slateDark },
  jade: { light: sageLight, dark: sageDark },
  orange: { light: sandLight, dark: sandDark },
  pink: { light: mauveLight, dark: mauveDark },
  plum: { light: mauveLight, dark: mauveDark },
  purple: { light: mauveLight, dark: mauveDark },
  sky: { light: slateLight, dark: slateDark },
  teal: { light: sageLight, dark: sageDark },
  violet: { light: mauveLight, dark: mauveDark },
};
