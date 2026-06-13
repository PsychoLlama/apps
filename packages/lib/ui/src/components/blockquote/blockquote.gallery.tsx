import type { ComponentProps } from 'solid-js';
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
  title: 'Blockquote',
  render: (props) => (
    <Blockquote selectable {...props}>
      {SAMPLE}
    </Blockquote>
  ),
  sections: [
    {
      title: 'Color',
      columns: COLORS.map((color) => ({ title: color, props: { color } })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof Blockquote>>;
