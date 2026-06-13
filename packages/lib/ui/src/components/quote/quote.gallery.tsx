import type { GalleryListing } from '@dev/gallery';
import Quote from './quote';
import Text from '../text/text';

const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Gallery listing for `Quote`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size} selectable>
          Twain wrote: <Quote>cat by the tail</Quote>.
        </Text>
      )),
    },
  ],
} satisfies GalleryListing;
