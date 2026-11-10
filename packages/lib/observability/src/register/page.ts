/**
 * Observability setup for the page's main thread. Import once from the
 * client entry, for its side effects:
 *
 * ```ts
 * import '@lib/observability/register/page';
 * ```
 *
 * Saves pending logs when the page is hidden, the last moment a page is
 * reliably told before it may be discarded.
 * @module
 */
import { prepareForExit } from '../logging/exit';

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') prepareForExit();
});
