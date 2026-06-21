import { type JSX } from 'solid-js';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { AppearanceToggle } from '@lib/theme/appearance-toggle';

/**
 * The gallery layout: the `<main>` frame shared by every `/gallery/*` route.
 * Each route renders its own `GalleryView` inside, so the breadcrumb can name
 * the manifest in view without the layout reverse-engineering the active route.
 */
export const Gallery = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

/**
 * A gallery view: a breadcrumb header over the scrollable content region. Each
 * route renders one — `trail` names where you are (`Gallery` on the landing
 * page, `Gallery › <manifest>` on a manifest page), and the content fills and
 * scrolls below it within the `Gallery` layout's `<main>` frame.
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
