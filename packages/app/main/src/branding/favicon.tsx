/// <reference types="@dev/build/vite-plugin/svg-to-png-types" />
import { Link } from '@solidjs/meta';
import brandmarkSvg from './brandmark.svg?url';
import appleTouchIcon from './brandmark.svg?to-png=180';

/**
 * Favicon `<link>` tags hoisted into `<head>` via `@solidjs/meta`.
 *
 * Modern browsers honor the SVG icon (small, scales at any DPR).
 * iOS Safari ignores SVG for the home-screen icon and reaches for
 * `apple-touch-icon`, which has to be a raster PNG — we rasterize
 * the SVG at build time (see `svg-to-png` vite plugin) so the
 * vector stays the single source of truth.
 *
 * The legacy `/favicon.ico` request is left to 404. Every browser
 * that still asks for it also reads `<link rel="icon">`, so the SVG
 * wins; serving an `.ico` only matters for tab icons in browsers
 * that pre-date 2020.
 */
export const Favicon = () => (
  <>
    <Link rel="icon" type="image/svg+xml" href={brandmarkSvg} />
    <Link rel="apple-touch-icon" href={appleTouchIcon} />
  </>
);
