import type { GalleryManifest } from '@dev/gallery';

/**
 * Gallery manifest for `@lib/ui`. Discovered by `@dev/gallery`'s build-time
 * glob and surfaced in the gallery app.
 */
export default {
  title: '@lib/ui',
  listings: import.meta.glob('./**/*.gallery.tsx'),
} satisfies GalleryManifest;
