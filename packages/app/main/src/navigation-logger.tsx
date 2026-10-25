import { createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { useClientValue } from '@lib/effects/solid';
import { createLogger } from '@lib/observability';
import type { ColorSchemeOption } from '@lib/theme';
import { $appearance } from '@lib/theme/behavior';

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
const readPageContext = (colorScheme: ColorSchemeOption) => {
  const ua = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;

  return {
    platform: ua?.platform,
    mobile: ua?.mobile,
    brands: ua?.brands,
    colorScheme,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    viewport: { width: innerWidth, height: innerHeight },
    screen: { width: screen.width, height: screen.height },
    devicePixelRatio: devicePixelRatio,
  };
};

/**
 * Logs each client-side navigation as a breadcrumb. Renders nothing;
 * must mount inside the {@link Router} so `useLocation` resolves. Tracks
 * `pathname` only — `search`/`hash` can carry data we'd rather not
 * persist. Once mounted, it logs `Page loaded.` with a one-time
 * snapshot of the browser environment; subsequent navigations log
 * `Navigated.` with `from`/`to`.
 */
export const NavigationLogger = () => {
  const location = useLocation();
  const appearance = useClientValue($appearance);

  // Keyed on readiness, which flips once after mount, not the value:
  // switching appearance isn't a page load.
  createEffect(
    on(
      () => appearance.ready,
      () => {
        const colorScheme = appearance();
        if (colorScheme === undefined) return;

        logger.info('Page loaded.', {
          path: location.pathname,
          ...readPageContext(colorScheme),
        });
      },
    ),
  );

  createEffect(
    on(
      () => location.pathname,
      (to, from) => {
        if (from !== undefined) logger.info('Page navigated.', { from, to });
      },
    ),
  );

  return null;
};
