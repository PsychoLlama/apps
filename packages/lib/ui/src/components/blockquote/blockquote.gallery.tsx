import type { GalleryListing } from '@dev/gallery';
import Blockquote from './blockquote';

const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SAMPLE =
  'Twenty years from now you will be more disappointed by the things you didn’t do than by the ones you did.';

/**
 * Gallery listing for `Blockquote`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Blockquote selectable color={color}>
          {SAMPLE}
        </Blockquote>
      )),
    },
  ],
} satisfies GalleryListing;
