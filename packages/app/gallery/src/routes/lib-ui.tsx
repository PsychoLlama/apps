import gallery, { listings } from '@lib/ui/gallery';
import { ManifestPage } from '../components/manifest-page';

/** `@lib/ui`'s gallery page. Listings come pre-globbed from the manifest. */
export default function LibUiGallery() {
  return (
    <ManifestPage
      title={gallery.name}
      description={gallery.description}
      groups={gallery.groups}
      listings={listings}
    />
  );
}
