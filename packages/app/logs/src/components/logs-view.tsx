import type { JSX } from 'solid-js';
import { FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';

/**
 * A logs view: the breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are — and the content fills and
 * scrolls below it within the logs layout's `<main>` frame.
 */
export const LogsView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => {
  return (
    <>
      <SiteHeader trail={props.trail} />
      <FrameBody>{props.children}</FrameBody>
    </>
  );
};
