import type { JSX } from 'solid-js';

/** A labeled row of pre-rendered component instances. */
export interface GallerySection {
  /** Heading shown above the row. */
  title: string;
  /** One JSX element per cell. Each tag is type-checked against its component. */
  items: ReadonlyArray<JSX.Element>;
}

/**
 * The shape a `*.gallery.tsx` file exports as its default — a single
 * component's listing, enumerated across labeled rows. Listings
 * `satisfies`-constrain their literal against this; a manifest's `listings`
 * glob discovers them.
 */
export interface GalleryListing {
  /**
   * Display heading for the listing, shown above its sections. Conventionally
   * the component's name (e.g. `Button`).
   */
  title: string;
  sections: ReadonlyArray<GallerySection>;
}

/**
 * The shape every package's `src/manifest.gallery.ts` exports as its default.
 * Packages `satisfies`-constrain their literal against this; the registry
 * (`@dev/gallery/manifests`) collects them via a build-time glob.
 */
export interface GalleryManifest {
  /** Display name for the entry. Conventionally the package's name. */
  title: string;

  /** One-line summary of the package, conventionally its `package.json` `description`. */
  description: string;

  /**
   * Deferred import of the package's collected listings. The sibling
   * `gallery-listings.tsx` eagerly globs every `*.gallery.tsx` into one chunk;
   * the manifest defers a single dynamic import of it. A manifest page loads all
   * of its listings in one request, while the deferral keeps them out of the
   * gallery's initial bundle.
   */
  listings: () => Promise<{ default: ReadonlyArray<GalleryListing> }>;
}

/**
 * Collect an eager `import.meta.glob` of a package's `*.gallery.tsx` modules
 * into a listing array — each module's default export is its
 * {@link GalleryListing}. A package's `gallery-listings.tsx` calls this so its
 * manifest can defer a single import that loads every listing at once.
 */
export const collectListings = (
  modules: Record<string, { default: GalleryListing }>,
): GalleryListing[] => Object.values(modules).map((module) => module.default);
