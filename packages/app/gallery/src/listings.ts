import type {
  GalleryListing as ListingData,
  GalleryManifest,
} from '@dev/gallery';
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
 * A lazily-imported listing module — its default export is the listing data.
 * {@link listingsOf} returns the deferred loaders; routing owns the actual
 * `lazy`/`Suspense` load.
 */
export type ListingModule = { default: ListingData };

/** A single listing within a manifest: its name and a deferred module loader. */
export interface Listing {
  /** Basename of the `*.gallery.tsx` file, used as the listing's heading. */
  name: string;
  /** Deferred import of the listing module; its default export is the data. */
  load: () => Promise<ListingModule>;
}

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
 * The manifest's listings as deferred loaders, sorted alphabetically by name.
 * The manifest page renders each one inline, so there are no per-listing pages.
 */
export const listingsOf = (manifest: GalleryManifest): Listing[] =>
  Object.entries(manifest.listings)
    .map(([path, load]) => ({
      name: listingName(path),
      load: load as () => Promise<ListingModule>,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
