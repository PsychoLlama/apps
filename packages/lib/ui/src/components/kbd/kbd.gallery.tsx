import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Kbd from './kbd';

const VARIANTS = ['classic', 'soft'] as const;

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
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, children: variant },
      })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof Kbd>>;
