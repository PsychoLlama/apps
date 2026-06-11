/**
 * The shape every package's `src/manifest.gallery.ts` exports as its default.
 * Packages `satisfies`-constrain their literal against this; the registry
 * (`@dev/gallery/manifests`) collects them via a build-time glob.
 */
export interface GalleryManifest {
  /** Display name for the entry. Conventionally the package's name. */
  title: string;
}
