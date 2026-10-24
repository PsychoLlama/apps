import { collect, pipe, reactive } from '@lib/effects';
import { defineCell, defineCommand } from '@lib/state';
import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type ThemeId,
} from '../constants';
import { removeItem, setItem, watchStorage } from './local-storage';

// An unset or unrecognized value reads as the default theme.
const parse = (stored: string | null): ThemeId =>
  THEME_IDS.find((id) => id === stored) ?? DEFAULT_THEME_ID;

// Hydrated from storage. Never hold it bare, or it never hears from
// other tabs.
const $themeCell = defineCell(() =>
  parse(localStorage.getItem(THEME_STORAGE_KEY)),
);

/** The theme changed. */
export const $themeChanged = defineCommand(
  [$themeCell],
  ([, setTheme]) =>
    (theme: ThemeId) =>
      setTheme(theme),
);

const $themeSync = pipe([
  $themeChanged,
  watchStorage(THEME_STORAGE_KEY, parse),
]);

/**
 * The active theme, hydrated from storage and kept in step with other
 * tabs. Client-only; it reads `localStorage`.
 */
export const $theme = collect([$themeCell, $themeSync], (theme) =>
  reactive(theme),
);

/**
 * Switch the theme, then persist it. The default theme clears storage,
 * so later loads follow whatever default ships. Storage that refuses
 * access is skipped. Storage goes last: if it fails otherwise, the
 * switch still shows.
 */
export const $setTheme = collect(
  [$themeChanged],
  (themeChanged) => (theme: ThemeId) => {
    themeChanged(theme);

    if (theme === DEFAULT_THEME_ID) removeItem(THEME_STORAGE_KEY);
    else setItem(THEME_STORAGE_KEY, theme);
  },
);
