import type { GalleryListing } from '@dev/gallery';
import Button, { type ButtonProps } from './button';

/**
 * Gallery listing for `Button`. Enumerates the component across its visual
 * axes. `ButtonProps` is a union over `as`; pin the `<button>` arm so
 * `Partial<P>` keeps the full prop set.
 */
export default {
  title: 'Button',
  render: (props) => <Button as="button" testId="button" {...props} />,
  sections: [
    {
      title: 'Variant',
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
        { title: 'Ghost', props: { variant: 'ghost', children: 'ghost' } },
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
    {
      title: 'Disabled',
      columns: [
        {
          title: 'Solid',
          props: { variant: 'solid', disabled: true, children: 'solid' },
        },
        {
          title: 'Soft',
          props: { variant: 'soft', disabled: true, children: 'soft' },
        },
        {
          title: 'Surface',
          props: { variant: 'surface', disabled: true, children: 'surface' },
        },
        {
          title: 'Outline',
          props: { variant: 'outline', disabled: true, children: 'outline' },
        },
        {
          title: 'Ghost',
          props: { variant: 'ghost', disabled: true, children: 'ghost' },
        },
      ],
    },
  ],
} satisfies GalleryListing<Extract<ButtonProps, { as?: 'button' }>>;
