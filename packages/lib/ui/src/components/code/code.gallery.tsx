import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Code from './code';

const VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

/**
 * Gallery listing for `Code`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Code',
  render: (props) => <Code {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, children: variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, children: color },
      })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof Code>>;
