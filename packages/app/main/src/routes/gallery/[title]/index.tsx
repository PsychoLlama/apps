import { ManifestPage } from '@app/gallery';
import { useParams } from '@solidjs/router';

/**
 * Renders the manifest page for the `title` route param (a manifest slug) — a
 * work-in-progress notice over links to that manifest's listings. An unknown
 * slug falls back to a not-found message.
 */
export default function GalleryManifestRoute() {
  const params = useParams<{ title: string }>();
  return <ManifestPage slug={params.title} />;
}
