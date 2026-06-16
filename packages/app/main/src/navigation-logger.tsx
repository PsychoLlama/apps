import { createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { createLogger } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE).namespace(
  'navigation',
);

/**
 * Logs each client-side navigation as a breadcrumb, giving every other
 * log a "which screen was the user on?" anchor. Renders nothing — it
 * exists only for the effect, and must mount inside the {@link Router} so
 * `useLocation` resolves against the active route.
 *
 * Effects don't run during SSG, so the first fire is the entry route on
 * client hydration, with one line per navigation after. Tracks `pathname`
 * alone: the route is the meaningful unit, and `search`/`hash` can carry
 * data we'd rather keep off a persisted log.
 */
export const NavigationLogger = () => {
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      (path) => {
        logger.info('Navigated.', { path });
      },
    ),
  );

  return null;
};
