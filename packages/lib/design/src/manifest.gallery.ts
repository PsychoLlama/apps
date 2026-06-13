import type { GalleryManifest } from '@dev/gallery';
import { name, description } from '../package.json';

export default {
  title: name,
  description,
  listings: import.meta.glob('./**/*.gallery.tsx'),
} satisfies GalleryManifest;
