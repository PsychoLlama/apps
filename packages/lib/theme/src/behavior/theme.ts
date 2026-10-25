import { collect, pipe, reactive } from '@lib/effects';
import { createCell, defineCommand } from '@lib/state';
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

/**
 * The active theme, hydrated from storage and kept in step with other
 * tabs. Client-only; it reads `localStorage`.
 */
export const $theme = pipe([
  () => {
    const [theme, setTheme] = createCell(
      parse(localStorage.getItem(THEME_STORAGE_KEY)),
    );

    return reactive(theme, watchStorage(THEME_STORAGE_KEY, parse, setTheme));
  },
]);

/** The theme changed. */
export const $themeChanged = defineCommand(
  [$theme],
  ([, setTheme]) =>
    (theme: ThemeId) =>
      setTheme(theme),
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
