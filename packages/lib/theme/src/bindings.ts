import { defineAction, defineEffect } from '@lib/state';
import {
  applyColorScheme,
  applyTheme,
  readActiveColorScheme,
  readActiveTheme,
  resetTheme,
} from './capabilities';
import {
  DEFAULT_THEME_ID,
  type ColorSchemeOption,
  type ThemeId,
} from './constants';
import { colorSchemeStore, themeStore } from './store';

/** Update the in-memory theme selection. */
export const setTheme = defineAction([themeStore], (theme, id: ThemeId) => {
  theme.id = id;
});

/** Rewind the in-memory theme selection to `DEFAULT_THEME_ID`. */
export const clearTheme = defineAction([themeStore], (theme) => {
  theme.id = DEFAULT_THEME_ID;
});

/**
 * Mirror the prelude-stamped `<html data-theme>` value into the store.
 * Run once on mount — the prelude is the canonical pre-paint setter, so
 * the store just learns what's already on screen.
 */
export const hydrateThemeEffect = defineEffect([], readActiveTheme, {
  onSuccess: setTheme,
});

/**
 * Switch the active theme. Dispatches `setTheme` first so the UI reacts
 * synchronously, then flips `<html data-theme>` and persists the choice
 * via localStorage so it survives reload.
 */
export const selectThemeEffect = defineEffect([], applyTheme, {
  onStart: setTheme,
});

/**
 * Forget the persisted preference and restore the default theme. Side
 * effects mirror `selectThemeEffect`, but localStorage drops the key —
 * so the next load picks up whatever default ships, rather than the
 * value the user happened to land on.
 */
export const resetThemeEffect = defineEffect([], resetTheme, {
  onStart: clearTheme,
});

/** Update the in-memory color-scheme selection. */
export const setColorScheme = defineAction(
  [colorSchemeStore],
  (scheme, id: ColorSchemeOption) => {
    scheme.id = id;
  },
);

/**
 * Mirror the prelude-stamped `<html data-color-scheme>` value into the
 * store. Run once on mount — the prelude is the canonical pre-paint
 * setter, so the store just learns what's already on screen.
 */
export const hydrateColorSchemeEffect = defineEffect(
  [],
  readActiveColorScheme,
  { onSuccess: setColorScheme },
);

/**
 * Switch the active color-scheme override. Dispatches `setColorScheme`
 * first so the UI reacts synchronously, then flips
 * `<html data-color-scheme>` (or drops it, for `'system'`) and updates
 * localStorage so the prelude can restore the choice before paint on
 * the next load.
 */
export const selectColorSchemeEffect = defineEffect([], applyColorScheme, {
  onStart: setColorScheme,
});
