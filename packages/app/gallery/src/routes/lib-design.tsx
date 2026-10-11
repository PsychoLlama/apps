import gallery, { listings } from '@lib/design/gallery';
import { ManifestPage } from '../components/manifest-page';

/** `@lib/design`'s gallery page. Listings come pre-globbed from the manifest. */
export default function LibDesignGallery() {
  return (
    <ManifestPage
      title={gallery.name}
      description={gallery.description}
      groups={gallery.groups}
      listings={listings}
    />
  );
}
