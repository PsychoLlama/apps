/**
 * `@app/gallery` — the design-system gallery. `Gallery` is the layout for every
 * `/gallery/*` route; `GalleryHome` lists the manifests, and `ManifestRoute`
 * renders a single manifest's listings on its dedicated `/gallery/<slug>` route.
 * `GalleryListing` types the eager `import.meta.glob` each route hands over.
 */
export { Gallery } from './components/gallery-view';
export { GalleryHome } from './components/gallery-home';
export { ManifestRoute } from './components/manifest-route';
export type { GalleryListing } from '@lib/gallery';
