import { Show, onCleanup, onMount, type JSX } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { LinkButton } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import {
  exportFlag,
  hydrateExportFlagEffect,
  setExportEnabled,
  watchExportFlag,
} from '../state/export-flag';
import {
  hydrateWorkerControlEffect,
  setWorkerControlled,
  watchWorkerControl,
  workerControl,
} from '../state/worker-control';

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
  const reconcileFlag = useEffect(hydrateExportFlagEffect);
  const setEnabled = useAction(setExportEnabled);
  const reconcileControl = useEffect(hydrateWorkerControlEffect);
  const setControlled = useAction(setWorkerControlled);

  // The store is seeded with the build-environment default, so first
  // paint (and prerender) match without a flash. Once mounted — OPFS is
  // client-only, unavailable during SSG — reconcile with any persisted
  // override and track changes made in other tabs.
  //
  // The export action also needs a service worker controlling the page to
  // answer its `/api/local/logs` navigation; reconcile that on mount too
  // (the worker is client-only) and track control handoffs.
  onMount(() => {
    void reconcileFlag();
    onCleanup(watchExportFlag(setEnabled));
    void reconcileControl();
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
