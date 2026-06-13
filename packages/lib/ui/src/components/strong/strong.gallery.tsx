import type { GalleryListing } from '@dev/gallery';
import Strong from './strong';
import Text from '../text/text';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Gallery listing for `Strong`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size} selectable>
          Quick <Strong>brown</Strong> fox.
        </Text>
      )),
    },
  ],
} satisfies GalleryListing;
