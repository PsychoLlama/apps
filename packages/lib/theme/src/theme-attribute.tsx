import { createEffect } from 'solid-js';
import { theme } from './theme-store';

/**
 * Mirror the active theme id onto `<html data-theme="...">`. The
 * matching `:root[data-theme="<id>"]` rule emitted by the eagerly
 * imported theme bundle wins by specificity, swapping the active
 * accent without re-fetching CSS.
 *
 * Mount once near the app root so the effect tracks `theme.id` for
 * the lifetime of the client.
 */
export const ThemeAttribute = () => {
  createEffect(() => {
    document.documentElement.dataset.theme = theme.id;
  });
  return null;
};
