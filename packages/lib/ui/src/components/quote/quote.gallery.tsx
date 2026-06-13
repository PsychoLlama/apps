import type { GalleryListing } from '@dev/gallery';
import Quote from './quote';
import Text from '../text/text';

/**
 * Gallery listing for `Quote`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'In context',
      items: [
        <Text as="p" selectable>
          Twain wrote: <Quote>cat by the tail</Quote>.
        </Text>,
      ],
    },
  ],
} satisfies GalleryListing;
