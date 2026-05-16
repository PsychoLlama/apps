import { createEffect, createRoot } from 'solid-js';
import { THEME_ATTRIBUTE } from './catalog';
import { theme } from './theme-store';

/**
 * Subscribe `theme.id` to `<html data-theme="...">` for the lifetime
 * of the client. The server entry stamps the initial attribute into
 * the prerendered HTML; this picks up where that leaves off, mirroring
 * subsequent picker changes to the DOM.
 *
 * Call once from the client entry. The reactive root is intentionally
 * never disposed — the subscription lives as long as the app does.
 */
export const syncThemeAttribute = (): void => {
  createRoot(() => {
    createEffect(() => {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, theme.id);
    });
  });
};
