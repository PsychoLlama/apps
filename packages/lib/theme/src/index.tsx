/// <reference types="@dev/build/vite-plugin/css-asset-types" />
import { Link } from '@solidjs/meta';
import url from './bundles/blue.css.ts?css-asset';

/**
 * `<link>` tag pointing at the default theme's standalone CSS
 * bundle. Render inside a `<MetaProvider>` so `solid-meta` hoists
 * the tag into `<head>` during SSR — the prerendered HTML carries
 * the link, and the browser starts fetching the bundle alongside
 * the document, before any JS evaluates.
 */
export const ThemeStylesheet = () => (
  <Link data-theme-stylesheet="" rel="stylesheet" href={url} />
);
