import type { GalleryManifest } from './index.ts';

/**
 * Every package's `src/manifest.gallery.ts`, discovered at build time. The
 * glob is rooted at `packages/` (`<tier>/<name>/src/...`) and eagerly loaded:
 * a manifest is just its title, description, and a deferred `listings` loader,
 * so eagerly importing them keeps the listings themselves out of this bundle.
 */
const modules = import.meta.glob<{ default: GalleryManifest }>(
  '../../../*/*/src/manifest.gallery.ts',
  { eager: true },
);

/** Collected gallery manifests, ready to render. */
export const galleryManifests: GalleryManifest[] = Object.values(modules).map(
  (module) => module.default,
);
