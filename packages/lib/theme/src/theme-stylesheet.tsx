import { Link } from '@solidjs/meta';
import { THEMES } from './catalog';
import { theme } from './theme-store';

const bundleUrlById = new Map(
  THEMES.map((entry) => [entry.id, entry.bundleUrl]),
);

/**
 * `<link>` tag pointing at the active theme's standalone CSS bundle.
 * Render inside a `<MetaProvider>` so `solid-meta` hoists the tag
 * into `<head>` during SSR — the prerendered HTML carries the link,
 * and the browser starts fetching the bundle alongside the document,
 * before any JS evaluates. The `href` reads the active theme id from
 * the shared store, so flipping the id at runtime swaps the linked
 * stylesheet.
 */
export const ThemeStylesheet = () => (
  <Link
    data-theme-stylesheet=""
    rel="stylesheet"
    href={bundleUrlById.get(theme.id)}
  />
);
