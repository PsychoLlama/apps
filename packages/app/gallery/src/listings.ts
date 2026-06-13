import type {
  GalleryListing as ListingData,
  GalleryManifest,
} from '@dev/gallery';
import { galleryManifests } from '@dev/gallery/manifests';

/** A single listing's entry in a manifest's link list. */
export interface ListingLink {
  /** Basename of the `*.gallery.tsx` file, used as both label and slug. */
  name: string;
  /** In-app path to the listing's page. */
  href: string;
}

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
 * A lazily-imported listing module — its default export is the listing data.
 * {@link findListing} returns the deferred loader; routing owns the actual
 * `lazy`/`Suspense` load.
 */
export type ListingModule = { default: ListingData };

/**
 * The listing's name — the basename of its module path minus the
 * `.gallery.tsx` suffix (e.g. `./components/badge/badge.gallery.tsx` → `badge`).
 */
const listingName = (path: string): string =>
  path
    .split('/')
    .pop()!
    .replace(/\.gallery\.tsx$/, '');

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
 * The manifest's listings as sorted nav entries, each linking to its own page
 * under `/gallery/{title-slug}/{name}`.
 */
export const listingsOf = (manifest: GalleryManifest): ListingLink[] =>
  Object.keys(manifest.listings)
    .map((path) => {
      const name = listingName(path);
      const href = `/gallery/${manifestSlug(manifest.title)}/${encodeURIComponent(name)}`;
      return { name, href };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

/**
 * The deferred loader for the listing under `titleSlug` (a manifest title's
 * {@link manifestSlug}) named `listing`, or `undefined` when neither matches.
 */
export const findListing = (
  titleSlug: string,
  listing: string,
): (() => Promise<ListingModule>) | undefined => {
  const manifest = galleryManifests.find(
    (entry) => manifestSlug(entry.title) === titleSlug,
  );
  const match = Object.entries(manifest?.listings ?? {}).find(
    ([path]) => listingName(path) === listing,
  );
  return match?.[1] as (() => Promise<ListingModule>) | undefined;
};
