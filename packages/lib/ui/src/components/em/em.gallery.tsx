import type { GalleryListing } from '@dev/gallery';
import Em from './em';
import Text from '../text/text';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Gallery listing for `Em`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size} selectable>
          Quick <Em>brown</Em> fox.
        </Text>
      )),
    },
  ],
} satisfies GalleryListing;
