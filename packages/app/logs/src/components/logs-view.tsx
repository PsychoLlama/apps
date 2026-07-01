import { Show, onCleanup, onMount, type JSX } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { LinkButton } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import {
  exportFlag,
  setExportEnabled,
  watchExportFlag,
} from '../state/export-flag';
import {
  setWorkerControlled,
  watchWorkerControl,
  workerControl,
} from '../state/worker-control';
import { hydrateExportAvailabilityEffect } from '../state/export-availability';

/**
 * The logs layout: the `<main>` frame for every `/logs/*` route. Each route
 * renders its own {@link LogsView} inside, so the breadcrumb can name the page
 * in view without the layout reverse-engineering the route.
 */
export const LogsLayout = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

/**
 * A logs view: the breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are — and the content fills and
 * scrolls below it within the {@link LogsLayout} frame.
 */
export const LogsView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => {
  const reconcile = useEffect(hydrateExportAvailabilityEffect);
  const setEnabled = useAction(setExportEnabled);
  const setControlled = useAction(setWorkerControlled);

  // Both stores are seeded so first paint (and prerender) match without a
  // flash. Once mounted — OPFS and the service worker are client-only,
  // unavailable during SSG — a single reconcile lands both gating
  // conditions in one flush; the watchers then track later changes: the
  // flag from any tab, and service-worker control handoffs.
  onMount(() => {
    void reconcile();
    onCleanup(watchExportFlag(setEnabled));
    onCleanup(watchWorkerControl(setControlled));
  });

  return (
    <>
      <SiteHeader
        trail={props.trail}
        actions={
          <Show when={exportFlag.enabled && workerControl.controlled}>
            <ExportButton />
          </Show>
        }
      />
      <FrameBody>{props.children}</FrameBody>
    </>
  );
};

/**
 * Export action pinned to the logs header tray. Downloads the whole log archive
 * as an `.ndjson` file from the service worker's `/api/local/logs` route, which
 * streams every persisted log oldest-first. `native` keeps the router out of
 * the way — the route is a service-worker resource, not an in-app page.
 *
 * `target="_self"` (rather than `download`) is load-bearing: a `download`
 * anchor bypasses the service worker with a native fetch, missing the stream
 * and landing on the 404 page. Navigating instead lets the worker answer and
 * its `Content-Disposition` header drive the download.
 */
const ExportButton = () => (
  <LinkButton
    testId="export-logs"
    variant="ghost"
    color="neutral"
    native
    href="/api/local/logs"
    target="_self"
  >
    <IconDownload aria-hidden="true" />
    Export
  </LinkButton>
);
