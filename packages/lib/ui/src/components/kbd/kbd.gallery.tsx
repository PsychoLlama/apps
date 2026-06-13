import type { GalleryListing } from '@dev/gallery';
import Kbd from './kbd';

const VARIANTS = ['classic', 'soft'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Gallery listing for `Kbd`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Kbd variant={variant}>{variant}</Kbd>),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Kbd size={size}>⌘ K</Kbd>),
    },
  ],
} satisfies GalleryListing;
