import { collect, pipe, reactive } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  type ColorSchemeOption,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';
import { $theme } from './theme';

// An unset or unrecognized value reads as `'system'`.
const parse = (stored: string | null): ColorSchemeOption =>
  COLOR_SCHEME_IDS.find((id) => id === stored) ?? 'system';

// Hydrated from storage. Never hold it bare, or it never hears from
// other tabs.
const $appearanceCell = defineCell(() =>
  parse(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)),
);

/** The appearance changed. */
export const $appearanceChanged = defineCommand(
  [$appearanceCell],
  ([, setAppearance]) =>
    (appearance: ColorSchemeOption) =>
      setAppearance(appearance),
);

const $appearanceSync = pipe([
  $appearanceChanged,
  watchStorage(COLOR_SCHEME_STORAGE_KEY, parse),
]);

/**
 * The light/dark/system appearance, hydrated from storage and kept in
 * step with other tabs. Client-only; it reads `localStorage`.
 */
export const $appearance = collect(
  [$appearanceCell, $appearanceSync],
  (appearance) => reactive(appearance),
);

/**
 * Switch the appearance: the cell, the theme-color meta tags, the
 * `<html>` attribute, then storage. `'system'` drops the attribute so
 * media queries take over, and clears storage. Storage that refuses
 * access is skipped. Storage goes last: if it fails otherwise, the
 * switch still shows.
 */
export const $setAppearance = collect(
  [$appearanceChanged, $theme],
  (appearanceChanged, theme) => (appearance: ColorSchemeOption) => {
    appearanceChanged(appearance);

    // Mirror the theme's page background into the browser chrome. A
    // forced scheme collapses both tags onto its color; otherwise each
    // tag's `prefers-color-scheme` media query picks the wrong one.
    //
    // TODO: Move reactivity to `@lib/theme/meta`.
    const replace = (tagId: string, tagContent: string) =>
      document.getElementById(tagId)?.setAttribute('content', tagContent);

    const colors = THEME_COLORS[theme()];
    const { light: lightMetaTag, dark: darkMetaTag } = THEME_COLOR_META_ID;
    replace(lightMetaTag, appearance === 'dark' ? colors.dark : colors.light);
    replace(darkMetaTag, appearance === 'light' ? colors.light : colors.dark);

    const { dataset } = document.documentElement;
    if (appearance === 'system') {
      delete dataset[COLOR_SCHEME_ATTRIBUTE];
      removeItem(COLOR_SCHEME_STORAGE_KEY);
    } else {
      dataset[COLOR_SCHEME_ATTRIBUTE] = appearance;
      setItem(COLOR_SCHEME_STORAGE_KEY, appearance);
    }
  },
);
