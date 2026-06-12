import type { GalleryManifest } from '@dev/gallery';

export default {
  title: '@lib/ui',
  listings: import.meta.glob('./**/*.gallery.tsx'),
} satisfies GalleryManifest;
