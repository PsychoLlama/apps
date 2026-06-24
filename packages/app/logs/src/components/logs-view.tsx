import type { JSX } from 'solid-js';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';

/**
 * The logs layout: the `<main>` frame shared by `/logs` and `/logs/:file`.
 * Each route renders its own {@link LogsView} inside, so the breadcrumb can
 * name the page in view without the layout reverse-engineering the route.
 */
export const LogsLayout = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

/**
 * A logs view: the breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are (`Logs`, or `Logs › <file>`
 * on a session page) — and the content fills and scrolls below it within the
 * {@link LogsLayout} frame.
 */
export const LogsView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => (
  <>
    <SiteHeader trail={props.trail} />
    <FrameBody>{props.children}</FrameBody>
  </>
);
