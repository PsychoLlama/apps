import type { GalleryListing } from '@lib/gallery';
import Quote from './quote';
import Text from '../text/text';

/**
 * Gallery listing for `Quote`. An inline quotation mark with no visual axes —
 * shown once in context.
 */
export default {
  title: 'Quote',
  render: () => (
    <Text as="p" selectable>
      Twain wrote: <Quote>cat by the tail</Quote>.
    </Text>
  ),
} satisfies GalleryListing;
