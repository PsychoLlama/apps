import type { JSX } from 'solid-js';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { Button } from '@lib/ui';
import IconDownload from 'virtual:icons/mdi/download-outline';

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
}) => (
  <>
    <SiteHeader trail={props.trail} actions={<ExportButton />} />
    <FrameBody>{props.children}</FrameBody>
  </>
);

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
