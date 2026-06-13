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
   * The package's `*.gallery.tsx` listings, keyed by module path. Each value is
   * a deferred dynamic import the gallery resolves on demand — produce this with
   * a non-eager `import.meta.glob` so listings stay out of the initial bundle.
   * Empty for now; listings land later.
   */
  listings: Record<string, () => Promise<unknown>>;
}
