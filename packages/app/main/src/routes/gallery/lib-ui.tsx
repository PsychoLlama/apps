import gallery, { listings } from '@lib/ui/gallery';
import { ManifestRoute } from '@app/gallery';

/** `@lib/ui`'s gallery page. Listings come pre-globbed from the manifest. */
export default function LibUiGallery() {
  return (
    <ManifestRoute
      title={gallery.name}
      description={gallery.description}
      groups={gallery.groups}
      listings={listings}
    />
  );
}
