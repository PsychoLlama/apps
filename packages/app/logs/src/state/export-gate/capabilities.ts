import { readEnvironment, subscribe, watchAll } from '@lib/runtime-config';
import { logExport } from '../../config';
import type { ExportGateState } from './gate';

/**
 * Resolve both conditions gating the export action: whether logs export is
 * enabled for the active environment — layering any persisted OPFS override
 * over the default — and whether a service worker controls the page. Both are
 * client-only, so this can't run during SSG.
 */
export const readExportGate = async (): Promise<ExportGateState> => ({
  enabled: (await readEnvironment(logExport)).enabled,
  controlled: isWorkerControlling(),
});

/**
 * Report whether a service worker currently controls this page — the signal
 * that same-origin navigations (like the log export route) will be answered by
 * the worker rather than escaping to the network. `false` wherever the Service
 * Worker API is unavailable (SSG, unsupported browsers, private windows that
 * disable it).
 */
export const isWorkerControlling = (): boolean =>
  Boolean(globalThis.navigator?.serviceWorker?.controller);

/** One of the export action's gating conditions settling on a new value. */
export type ExportGateChange =
  | { source: 'flag'; enabled: boolean }
  | { source: 'worker'; controlled: boolean };

/**
 * Watch both gating conditions at once, reporting each resolved value as it
 * lands.
 *
 * Flag changes arrive from any browsing context, including this tab's own
 * writes, so the subscription is the live source of truth once the mount-time
 * read has seeded it. `controllerchange` fires when a newly activated worker
 * claims the page (ours calls `clients.claim()` on activate), so a first visit
 * flips to controlled without a reload. Where the Service Worker API is
 * missing entirely, that half simply never reports.
 *
 * See {@link watchAll} for the buffering and teardown guarantees the stream
 * carries.
 */
export const watchExportGate = (
  signal: AbortSignal,
): AsyncGenerator<ExportGateChange> =>
  watchAll(signal, (push) => [
    subscribe(logExport, ({ enabled }) => push({ source: 'flag', enabled })),
    watchWorkerControl((controlled) => push({ source: 'worker', controlled })),
  ]);

/**
 * Subscribe to service-worker control handoffs, reporting whether the page is
 * controlled after each change. Returns an unsubscribe; a no-op where the
 * Service Worker API is unavailable.
 */
const watchWorkerControl = (
  onChange: (controlled: boolean) => void,
): (() => void) => {
  const container = globalThis.navigator?.serviceWorker;
  if (!container) return () => {};

  const listener = () => onChange(Boolean(container.controller));
  container.addEventListener('controllerchange', listener);
  return () => container.removeEventListener('controllerchange', listener);
};
