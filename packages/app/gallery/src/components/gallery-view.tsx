import { type JSX } from 'solid-js';
import { Flex } from '@lib/ui';
import { SiteHeader, type SiteHeaderCrumb } from '@lib/shell';
import { AppearanceToggle } from '@lib/theme/appearance-toggle';
import * as css from './gallery-view.css';

/**
 * The gallery layout: the `<main>` frame shared by every `/gallery/*` route.
 * Each route renders its own `GalleryView` inside, so the breadcrumb can name
 * the manifest in view without the layout reverse-engineering the active route.
 */
export const Gallery = (props: { children?: JSX.Element }) => (
  <Flex as="main" direction="column" class={css.layout}>
    {props.children}
  </Flex>
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
    <Flex
      as="article"
      direction="column"
      gap={6}
      px={5}
      py={5}
      class={css.content}
    >
      {props.children}
    </Flex>
  </>
);
