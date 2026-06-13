import {
  ListingView,
  ManifestPage,
  type Listing,
  type ListingModule,
} from '@app/gallery';
import { useParams } from '@solidjs/router';
import { Suspense, lazy } from 'solid-js';

/**
 * Renders the manifest page for the `title` route param (a manifest slug) —
 * every listing the manifest contributes, rendered inline and sorted
 * alphabetically. Each listing's body is code-split behind its own
 * `<Suspense>` so they stream in independently. An unknown slug falls back to a
 * not-found message.
 */
export default function GalleryManifestRoute() {
  const params = useParams<{ title: string }>();

  const renderListing = (listing: Listing) => {
    const Body = lazy(() =>
      listing.load().then((module: ListingModule) => ({
        default: () => <ListingView listing={module.default} />,
      })),
    );

    return (
      <Suspense>
        <Body />
      </Suspense>
    );
  };

  return <ManifestPage slug={params.title} renderListing={renderListing} />;
}
