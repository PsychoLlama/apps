import { name, description } from '@lib/design/package.json';
import { ManifestRoute, type GalleryListing } from '@app/gallery';

/**
 * `@lib/design`'s gallery page. The eager glob bakes every `*.gallery.tsx`
 * listing into this route's chunk, so SolidStart preloads them with the route —
 * the page paints complete instead of flashing while a deferred import resolves.
 */
export default function LibDesignGallery() {
  return (
    <ManifestRoute
      title={name}
      description={description}
      listings={import.meta.glob<{ default: GalleryListing<unknown> }>(
        '../../../../../lib/design/src/**/*.gallery.tsx',
        { eager: true },
      )}
    />
  );
}
