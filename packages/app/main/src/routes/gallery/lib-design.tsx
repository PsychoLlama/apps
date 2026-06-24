import gallery, { listings } from '@lib/design/gallery';
import { ManifestRoute } from '@app/gallery';

/** `@lib/design`'s gallery page. Listings come pre-globbed from the manifest. */
export default function LibDesignGallery() {
  return (
    <ManifestRoute
      title={gallery.name}
      description={gallery.description}
      groups={gallery.groups}
      listings={listings}
    />
  );
}
