import type { GalleryListing } from '@dev/gallery';
import Em from './em';
import Text from '../text/text';

/**
 * Gallery listing for `Em`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'In context',
      items: [
        <Text as="p" selectable>
          Quick <Em>brown</Em> fox.
        </Text>,
      ],
    },
  ],
} satisfies GalleryListing;
