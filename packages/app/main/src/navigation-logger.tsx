import { createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { createLogger } from '@lib/observability';
import { readActiveColorScheme } from '@lib/theme/runtime';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** Shape of `navigator.userAgentData` — not yet in the TS DOM lib. */
interface UserAgentData {
  platform: string;
  mobile: boolean;
  brands: ReadonlyArray<{ brand: string; version: string }>;
}

/**
 * Snapshot of browser/device facts worth attaching to the entry-fire log.
 * Captured once per page load to give breadcrumbs enough environment context
 * to reproduce environment-specific bugs (viewport, color scheme, locale,
 * etc). UA client hints are best-effort — absent on Firefox/Safari and any
 * non-secure context, so each collapses to `undefined`.
 */
const readPageContext = () => {
  const ua = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;

  // TODO: Use real structures when Holz drops the nested object limitation.
  return {
    platform: ua?.platform,
    mobile: ua?.mobile,
    brands: ua?.brands.map(({ brand, version }) => `${brand} ${version}`),
    colorScheme: readActiveColorScheme(),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    viewport: `${innerWidth}x${innerHeight}`,
    screen: `${screen.width}x${screen.height}`,
    devicePixelRatio: devicePixelRatio,
  };
};

/**
 * Logs each client-side navigation as a breadcrumb. Renders nothing;
 * must mount inside the {@link Router} so `useLocation` resolves. Tracks
 * `pathname` only — `search`/`hash` can carry data we'd rather not
 * persist. The entry fire (no prior route) logs `Page loaded.` with a
 * one-time snapshot of the browser environment; subsequent navigations
 * log `Navigated.` with `from`/`to`.
 */
export const NavigationLogger = () => {
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      (to, from) => {
        if (from === undefined) {
          logger.info('Page loaded.', { path: to, ...readPageContext() });
          return;
        }

        logger.info('Page navigated.', { from, to });
      },
    ),
  );

  return null;
};
