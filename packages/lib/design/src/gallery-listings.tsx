import { collectListings, type GalleryListing } from '@dev/gallery';

/**
 * Every `*.gallery.tsx` listing in this package, eagerly globbed into a single
 * chunk. `manifest.gallery.ts` defers one dynamic import of this module, so a
 * manifest page loads all of its listings at once rather than fetching each in
 * parallel.
 */
export default collectListings(
  import.meta.glob<{ default: GalleryListing<unknown> }>('./**/*.gallery.tsx', {
    eager: true,
  }),
);
