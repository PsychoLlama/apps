import type { GalleryListing } from '@dev/gallery';
import Badge, { type BadgeProps } from './badge';

/**
 * Gallery listing for `Badge`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Badge',
  render: (props) => <Badge {...props} />,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Solid', props: { variant: 'solid', children: 'solid' } },
        { title: 'Soft', props: { variant: 'soft', children: 'soft' } },
        {
          title: 'Surface',
          props: { variant: 'surface', children: 'surface' },
        },
        {
          title: 'Outline',
          props: { variant: 'outline', children: 'outline' },
        },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'High contrast', props: { highContrast: true } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent', children: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral', children: 'neutral' } },
        { title: 'Danger', props: { color: 'danger', children: 'danger' } },
        { title: 'Warning', props: { color: 'warning', children: 'warning' } },
        { title: 'Success', props: { color: 'success', children: 'success' } },
      ],
    },
    {
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none', children: 'none' } },
        { title: 'Small', props: { radius: 'small', children: 'small' } },
        { title: 'Medium', props: { radius: 'medium', children: 'medium' } },
        { title: 'Large', props: { radius: 'large', children: 'large' } },
        { title: 'Full', props: { radius: 'full', children: 'full' } },
      ],
    },
  ],
} satisfies GalleryListing<BadgeProps>;
