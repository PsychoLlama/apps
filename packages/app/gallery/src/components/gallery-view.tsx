import { type JSX } from 'solid-js';
import { Frame, FrameBody, SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { AppearanceToggle } from '@lib/theme/appearance-toggle';

/**
 * A gallery view: a `<main>` frame with a breadcrumb header over the
 * scrollable content region. Each route renders one — `trail` names where you
 * are past the app's root crumb (empty on the landing page, `<manifest>` on a
 * manifest page), and the content fills and scrolls below it.
 */
export const GalleryView = (props: {
  trail?: SiteHeaderCrumb[];
  children?: JSX.Element;
}) => (
  <Frame>
    <SiteHeader trail={props.trail} actions={<AppearanceToggle />} />
    <FrameBody as="article">{props.children}</FrameBody>
  </Frame>
);
