import { Show } from 'solid-js';
import { Link, Meta } from '@solidjs/meta';
import { useAppConfig } from './context';

export interface BrandingProps {
  /** URL of the SVG favicon, e.g. a `./brandmark.svg?url` import. */
  svg: string;

  /**
   * URL of a 180px PNG for `apple-touch-icon`, e.g. a
   * `./brandmark.svg?to-png=180` import.
   */
  touchIcon: string;

  /**
   * Whether the app is installable. Adds the mobile web app meta tags that
   * mirror the manifest for browsers (mainly iOS) that ignore it.
   */
  pwa: boolean;
}

/**
 * Favicon links, plus the iOS PWA meta tags for installable apps, hoisted
 * into `<head>` via `@solidjs/meta`.
 *
 * Modern browsers honor the SVG icon (small, scales at any DPR).
 * iOS Safari ignores SVG for the home-screen icon and reaches for
 * `apple-touch-icon`, which has to be a raster PNG — rasterize the SVG
 * at build time (see `svg-to-png` vite plugin) so the vector stays the
 * single source of truth.
 *
 * iOS also ignores most of the web app manifest, so the
 * `apple-mobile-web-app-*` tags mirror the relevant fields
 * (`display: standalone` becomes `*-capable=yes`; the manifest's
 * `name` becomes `*-title`). `black-translucent` pairs with the
 * `viewport-fit=cover` viewport so the page background fills the
 * status-bar area instead of leaving a fixed black or white strip.
 *
 * Chrome reads `display: standalone` from the manifest, but
 * deprecates the Apple-prefixed `*-capable` tag — pair it with the
 * standardized `mobile-web-app-capable` to silence the console
 * warning.
 *
 * The legacy `/favicon.ico` request is left to 404. Every browser
 * that still asks for it also reads `<link rel="icon">`, so the SVG
 * wins; serving an `.ico` only matters for tab icons in browsers
 * that pre-date 2020.
 */
export const Branding = (props: BrandingProps) => {
  const app = useAppConfig();

  return (
    <>
      <Link rel="icon" type="image/svg+xml" href={props.svg} />
      <Link rel="apple-touch-icon" href={props.touchIcon} />

      <Show when={props.pwa}>
        <Meta name="mobile-web-app-capable" content="yes" />
        <Meta name="apple-mobile-web-app-capable" content="yes" />
        <Meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <Meta name="apple-mobile-web-app-title" content={app.name} />
      </Show>
    </>
  );
};
