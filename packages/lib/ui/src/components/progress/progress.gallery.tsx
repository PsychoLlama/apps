import type { GalleryListing } from '@dev/gallery';
import Progress, { type ProgressProps } from './progress';
import Flex from '../flex/flex';
import * as css from './progress.gallery.css';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
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
  title: 'Progress',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({ title: color, props: { color } })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
    },
    {
      title: 'State',
      columns: [
        { title: '0%', props: { value: 0 } },
        { title: '40%', props: { value: 40 } },
        { title: '100%', props: { value: 100 } },
        { title: 'Indeterminate', props: { value: null } },
      ],
    },
  ],
} satisfies GalleryListing<ProgressProps>;
