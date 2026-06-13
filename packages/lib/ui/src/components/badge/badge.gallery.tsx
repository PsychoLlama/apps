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
        { title: 'None', props: { radius: 'none', children: 'none' } },
        { title: 'Small', props: { radius: 'small', children: 'small' } },
        { title: 'Medium', props: { radius: 'medium', children: 'medium' } },
        { title: 'Large', props: { radius: 'large', children: 'large' } },
        { title: 'Full', props: { radius: 'full', children: 'full' } },
      ],
      rows: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Outline', props: { variant: 'outline' } },
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
      title: 'High contrast',
      columns: [
        {
          title: 'Solid',
          props: { variant: 'solid', highContrast: true, children: 'solid' },
        },
        {
          title: 'Soft',
          props: { variant: 'soft', highContrast: true, children: 'soft' },
        },
        {
          title: 'Surface',
          props: {
            variant: 'surface',
            highContrast: true,
            children: 'surface',
          },
        },
        {
          title: 'Outline',
          props: {
            variant: 'outline',
            highContrast: true,
            children: 'outline',
          },
        },
      ],
    },
  ],
} satisfies GalleryListing<BadgeProps>;
