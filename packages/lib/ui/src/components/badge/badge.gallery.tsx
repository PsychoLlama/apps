import type { Listing } from '#gallery';
import Badge, { type BadgeProps } from './badge';

/**
 * Gallery listing for `Badge`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Badge',
  group: 'display',
  render: (props) => <Badge {...props}>Active</Badge>,
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
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
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
        { title: 'Danger', props: { color: 'danger' } },
        { title: 'Warning', props: { color: 'warning' } },
        { title: 'Success', props: { color: 'success' } },
      ],
    },
    {
      title: 'High contrast',
      columns: [
        {
          title: 'Solid',
          props: { variant: 'solid', highContrast: true },
        },
        {
          title: 'Soft',
          props: { variant: 'soft', highContrast: true },
        },
        {
          title: 'Surface',
          props: { variant: 'surface', highContrast: true },
        },
        {
          title: 'Outline',
          props: { variant: 'outline', highContrast: true },
        },
      ],
    },
  ],
} satisfies Listing<BadgeProps>;
