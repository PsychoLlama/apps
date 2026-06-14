import type { GalleryListing } from '@dev/gallery';
import Kbd, { type KbdProps } from './kbd';

/**
 * Gallery listing for `Kbd`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Kbd',
  render: (props) => <Kbd {...props}>Esc</Kbd>,
  sections: [
    {
      title: 'Variant',
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
  ],
} satisfies GalleryListing<KbdProps>;
