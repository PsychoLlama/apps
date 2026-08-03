import { type JSX } from 'solid-js';
import { FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { AppearanceToggle } from '@lib/theme/appearance-toggle';

/**
 * A gallery view: a breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are (`Gallery` on the landing
 * page, `Gallery › <manifest>` on a manifest page), and the content fills and
 * scrolls below it within the gallery layout's `<main>` frame.
 */
export const GalleryView = (props: {
  trail: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => (
  <>
    <SiteHeader trail={props.trail} actions={<AppearanceToggle />} />
    <FrameBody as="article">{props.children}</FrameBody>
  </>
);
