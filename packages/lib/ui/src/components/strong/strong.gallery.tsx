import type { GalleryListing } from '@dev/gallery';
import Strong from './strong';
import Text from '../text/text';

/**
 * Gallery listing for `Strong`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Strong',
  sections: [
    {
      title: 'In context',
      items: [
        <Text as="p" selectable>
          Quick <Strong>brown</Strong> fox.
        </Text>,
      ],
    },
  ],
} satisfies GalleryListing;
