import type { GalleryListing } from '@dev/gallery';
import Kbd, { type KbdProps } from './kbd';

/**
 * Gallery listing for `Kbd`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Kbd',
  render: (props) => <Kbd {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: [
        {
          title: 'Classic',
          props: { variant: 'classic', children: 'classic' },
        },
        { title: 'Soft', props: { variant: 'soft', children: 'soft' } },
      ],
    },
  ],
} satisfies GalleryListing<KbdProps>;
