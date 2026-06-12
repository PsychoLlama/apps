import type { GalleryManifest } from '@dev/gallery';

export default {
  title: '@lib/design',
  listings: import.meta.glob('./**/*.gallery.tsx'),
} satisfies GalleryManifest;
