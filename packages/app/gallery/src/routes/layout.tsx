import { type JSX } from 'solid-js';
import { Frame } from '@lib/shell';

/**
 * The gallery layout: the `<main>` frame shared by every `/gallery/*` route.
 * Each route renders its own `GalleryView` inside, so the breadcrumb can name
 * the manifest in view without the layout reverse-engineering the active route.
 *
 * Beneath it, `./home` lists the manifests at `/gallery` and `./manifest`
 * renders one manifest's listings on its dedicated `/gallery/<slug>` route.
 */
const Gallery = (props: { children?: JSX.Element }) => (
  <Frame>{props.children}</Frame>
);

export default Gallery;
