/**
 * The shape every package's `src/manifest.gallery.ts` exports as its default.
 * Packages `satisfies`-constrain their literal against this; the registry
 * (`@dev/gallery/manifests`) collects them via a build-time glob.
 */
export interface GalleryManifest {
  /** Display name for the entry. Conventionally the package's name. */
  title: string;

  /**
   * The package's `*.gallery.tsx` listings, keyed by module path. Each value is
   * a deferred dynamic import the gallery resolves on demand — produce this with
   * a non-eager `import.meta.glob` so listings stay out of the initial bundle.
   * Empty for now; listings land later.
   */
  listings: Record<string, () => Promise<unknown>>;
}
