import type { GalleryListing } from '@dev/gallery';
import Progress, { type ProgressProps } from './progress';
import Flex from '../flex/flex';
import * as css from './progress.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const Demo = (props: Partial<ProgressProps>) => (
  <Flex as="div" class={css.galleryCell}>
    <Progress value={60} {...props} />
  </Flex>
);

/**
 * Gallery listing for `Progress`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => <Demo variant={variant} />),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Demo color={color} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'State',
      items: [
        <Demo value={0} />,
        <Demo value={40} />,
        <Demo value={100} />,
        <Demo value={null} />,
      ],
    },
  ],
} satisfies GalleryListing;
