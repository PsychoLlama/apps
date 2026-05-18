import { defineAction, defineEffect } from '@lib/state';
import { applyTheme, readActiveTheme } from './capabilities';
import type { ThemeId } from './constants';
import { themeStore } from './store';

/** Update the in-memory theme selection. */
export const setTheme = defineAction([themeStore], (theme, id: ThemeId) => {
  theme.id = id;
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
