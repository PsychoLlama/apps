import type { GalleryManifest } from '@dev/gallery';
import { name, description } from '../package.json';

export default {
  title: name,
  description,
  listings: () => import('./gallery-listings'),
} satisfies GalleryManifest;
