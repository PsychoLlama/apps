import { Link } from '@solidjs/meta';

export interface BrandingProps {
  /** URL of the SVG favicon, e.g. a `./brandmark.svg?url` import. */
  svg: string;

  /**
   * URL of a 180px PNG for `apple-touch-icon`, e.g. a
   * `./brandmark.svg?to-png=180` import.
   */
  touchIcon: string;
}

/**
 * Favicon links, hoisted into `<head>` via `@solidjs/meta`.
 *
 * Modern browsers honor the SVG icon (small, scales at any DPR).
 * iOS Safari ignores SVG for the home-screen icon and reaches for
 * `apple-touch-icon`, which has to be a raster PNG — rasterize the SVG
 * at build time (see `svg-to-png` vite plugin) so the vector stays the
 * single source of truth.
 *
 * The legacy `/favicon.ico` request is left to 404. Every browser
 * that still asks for it also reads `<link rel="icon">`, so the SVG
 * wins; serving an `.ico` only matters for tab icons in browsers
 * that pre-date 2020.
 */
export const Branding = (props: BrandingProps) => (
  <>
    <Link rel="icon" type="image/svg+xml" href={props.svg} />
    <Link rel="apple-touch-icon" href={props.touchIcon} />
  </>
);
