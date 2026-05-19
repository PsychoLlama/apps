/// <reference types="@dev/build/vite-plugin/svg-to-png-types" />
import { Link, Meta } from '@solidjs/meta';
import brandmarkSvg from './brandmark.svg?url';
import appleTouchIcon from './brandmark.svg?to-png=180';

/**
 * Favicon links and iOS PWA meta tags hoisted into `<head>` via
 * `@solidjs/meta`.
 *
 * Modern browsers honor the SVG icon (small, scales at any DPR).
 * iOS Safari ignores SVG for the home-screen icon and reaches for
 * `apple-touch-icon`, which has to be a raster PNG — we rasterize
 * the SVG at build time (see `svg-to-png` vite plugin) so the
 * vector stays the single source of truth.
 *
 * iOS also ignores most of the web app manifest, so the
 * `apple-mobile-web-app-*` tags below mirror the relevant fields
 * (`display: standalone` becomes `*-capable=yes`; the manifest's
 * `name` becomes `*-title`). `black-translucent` pairs with the
 * `viewport-fit=cover` viewport so the page background fills the
 * status-bar area instead of leaving a fixed black or white strip.
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
    <Meta name="apple-mobile-web-app-capable" content="yes" />
    <Meta
      name="apple-mobile-web-app-status-bar-style"
      content="black-translucent"
    />
    <Meta name="apple-mobile-web-app-title" content="Apps" />
  </>
);
