import type { GalleryListing } from '@lib/gallery';
import Progress, { type ProgressProps } from './progress';
import Flex from '../flex/flex';
import * as css from './progress.gallery.css';

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
      title: 'Theme colors',
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
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
    {
      title: 'State',
      columns: [
        { title: '0%', props: { value: 0 } },
        { title: '40%', props: { value: 40 } },
        { title: '100%', props: { value: 100 } },
        { title: 'Indeterminate', props: { value: null } },
      ],
    },
    {
      title: 'Radius',
      rows: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
  ],
} satisfies GalleryListing<ProgressProps>;
