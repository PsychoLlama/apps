import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Badge from './badge';

const VARIANTS = ['solid', 'soft', 'surface', 'outline'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

/**
 * Gallery listing for `Badge`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Badge',
  render: (props) => <Badge {...props} />,
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
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({
        title: radius,
        props: { radius, children: radius },
      })),
    },
    {
      title: 'High contrast',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, highContrast: true, children: variant },
      })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof Badge>>;
