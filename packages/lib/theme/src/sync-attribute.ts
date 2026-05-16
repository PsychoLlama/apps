import { createEffect } from 'solid-js';
import { THEME_ATTRIBUTE } from './catalog';
import { theme } from './theme-store';

/**
 * Mirror `theme.id` onto `<html data-theme="...">` for the lifetime of
 * the surrounding owner. The server entry stamps the initial attribute
 * into prerendered HTML; this picks up subsequent picker changes.
 *
 * Call once from inside a Solid component (e.g. the app root). The
 * effect is a no-op during SSR, so it's safe to invoke unconditionally.
 */
export const syncThemeAttribute = (): void => {
  createEffect(() => {
    document.documentElement.dataset[THEME_ATTRIBUTE] = theme.id;
  });
};
