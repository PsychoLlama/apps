import type { GalleryListing } from '@dev/gallery';
import Blockquote, { type BlockquoteProps } from './blockquote';

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
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
        { title: 'Danger', props: { color: 'danger' } },
        { title: 'Warning', props: { color: 'warning' } },
        { title: 'Success', props: { color: 'success' } },
      ],
    },
  ],
} satisfies GalleryListing<BlockquoteProps>;
