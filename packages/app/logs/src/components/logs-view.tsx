import { Show, onCleanup, onMount, type JSX } from 'solid-js';
import { useAction, useEffect } from '@lib/state';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Button } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';
import {
  exportFlag,
  hydrateExportFlagEffect,
  setExportEnabled,
  watchExportFlag,
} from '../state/export-flag';

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

  // The store is seeded with the build-environment default, so first
  // paint (and prerender) match without a flash. Once mounted — OPFS is
  // client-only, unavailable during SSG — reconcile with any persisted
  // override and track changes made in other tabs.
  onMount(() => {
    void reconcileFlag();
    onCleanup(watchExportFlag(setEnabled));
  });

  return (
    <>
      <SiteHeader
        trail={props.trail}
        actions={
          <Show when={exportFlag.enabled}>
            <ExportButton />
          </Show>
        }
      />
      <FrameBody>{props.children}</FrameBody>
    </>
  );
};

/**
 * Export action pinned to the logs header tray. Offers to pull the archive out
 * to a file. UI only for now — wiring the actual export comes later.
 */
const ExportButton = () => (
  <Button testId="export-logs" variant="ghost" color="neutral">
    <IconDownload aria-hidden="true" />
    Export
  </Button>
);
