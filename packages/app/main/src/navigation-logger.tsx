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
 *
 * `on` hands the previous tracked value straight to the callback, so the
 * route we came `from` rides along for free — `null` on the entry fire,
 * which has no prior route.
 */
export const NavigationLogger = () => {
  const location = useLocation();

  createEffect(
    on(
      () => location.pathname,
      (to, from) => {
        logger.info('Navigated.', { from: from ?? null, to });
      },
    ),
  );

  return null;
};
