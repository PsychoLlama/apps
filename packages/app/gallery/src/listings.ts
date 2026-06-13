import type { GalleryListing, GalleryManifest } from '@dev/gallery';
import { galleryManifests } from '@dev/gallery/manifests';

/** A manifest's card on the gallery landing page. */
export interface ManifestLink {
  /** The manifest's display title — conventionally the package name. */
  title: string;
  /** One-line summary of the manifest's package. */
  description: string;
  /** URL-safe slug for the manifest, used as its route segment. */
  slug: string;
  /** In-app path to the manifest's page. */
  href: string;
}

/**
 * A URL-safe slug for a manifest title. Titles carry a slash (`@lib/ui`), and a
 * slash can't survive a single path segment: the static prerender decodes a
 * `%2F` back into a separator, so the route stops matching and the page renders
 * empty. Dropping the leading `@` and swapping `/` for `-` keeps each title a
 * stable, readable, slash-free segment (`@lib/ui` → `lib-ui`).
 */
const manifestSlug = (title: string): string =>
  title.replace(/^@/, '').replaceAll('/', '-');

/**
 * Every manifest as a landing-page card link, sorted by title. The card routes
 * to the manifest's own page under `/gallery/{title-slug}`.
 */
export const manifestLinks: ManifestLink[] = galleryManifests
  .map((manifest) => {
    const slug = manifestSlug(manifest.title);
    return {
      title: manifest.title,
      description: manifest.description,
      slug,
      href: `/gallery/${slug}`,
    };
  })
  .sort((left, right) => left.title.localeCompare(right.title));

/** The manifest whose title slugifies to `titleSlug`, or `undefined`. */
export const findManifest = (titleSlug: string): GalleryManifest | undefined =>
  galleryManifests.find((entry) => manifestSlug(entry.title) === titleSlug);

/**
 * Load every listing a manifest contributes, sorted by title. The manifest's
 * `listings` loader resolves a single chunk holding all of them, so a manifest
 * page's listings arrive together in one request rather than streaming in one
 * at a time.
 */
export const loadListings = async (
  manifest: GalleryManifest,
): Promise<GalleryListing<unknown>[]> => {
  const module = await manifest.listings();
  return [...module.default].sort((left, right) =>
    left.title.localeCompare(right.title),
  );
};
