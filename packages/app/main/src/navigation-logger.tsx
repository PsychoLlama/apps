import { createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { createLogger } from '@lib/observability';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Logs each client-side navigation as a breadcrumb. Renders nothing;
 * must mount inside the {@link Router} so `useLocation` resolves. Tracks
 * `pathname` only — `search`/`hash` can carry data we'd rather not
 * persist. `from` is `null` on the entry fire (no prior route).
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
