import type { GalleryListing } from '@dev/gallery';
import Kbd from './kbd';

const VARIANTS = ['classic', 'soft'] as const;

/**
 * Gallery listing for `Kbd`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Kbd',
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Kbd variant={variant}>{variant}</Kbd>),
    },
  ],
} satisfies GalleryListing;
