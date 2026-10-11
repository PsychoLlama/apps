/// <reference types="@dev/vite-plugin-pwa/types" />
import { Link, Meta } from '@solidjs/meta';
import manifestUrl from 'virtual:pwa-manifest';
import { useAppConfig } from './context';

/**
 * Head tags that make an app installable, hoisted into `<head>` via
 * `@solidjs/meta`. Requires `substrate({ pwa })`, which emits the
 * manifest behind `virtual:pwa-manifest`.
 *
 * iOS ignores most of the web app manifest, so the
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
 */
export const PwaMeta = () => {
  const app = useAppConfig();

  return (
    <>
      {/* Stable, revalidating URL — see `@dev/vite-plugin-pwa`. */}
      <Link rel="manifest" href={manifestUrl} />

      <Meta name="mobile-web-app-capable" content="yes" />
      <Meta name="apple-mobile-web-app-capable" content="yes" />
      <Meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
      <Meta name="apple-mobile-web-app-title" content={app.name} />
    </>
  );
};
