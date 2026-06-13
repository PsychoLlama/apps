import { ManifestListings, ManifestPage, loadListings } from '@app/gallery';
import { useParams } from '@solidjs/router';
import { Suspense, lazy } from 'solid-js';

/**
 * Renders the manifest page for the `title` route param (a manifest slug) — the
 * manifest's title over every listing it contributes, loaded in a single batch
 * and sorted by title. The whole batch is code-split behind one `<Suspense>`, so
 * every listing arrives together. An unknown slug falls back to a not-found
 * message.
 */
export default function GalleryManifestRoute() {
  const params = useParams<{ title: string }>();
  return (
    <ManifestPage
      slug={params.title}
      renderListings={(manifest) => {
        const Listings = lazy(async () => {
          const listings = await loadListings(manifest);
          return { default: () => <ManifestListings listings={listings} /> };
        });
        return (
          <Suspense>
            <Listings />
          </Suspense>
        );
      }}
    />
  );
}
