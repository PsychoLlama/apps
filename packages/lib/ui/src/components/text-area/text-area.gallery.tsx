import type { GalleryListing } from '@dev/gallery';
import TextArea, { type TextAreaProps } from './text-area';

/**
 * Gallery listing for `TextArea`. The headline view crosses variant against
 * input state; the remaining tabs enumerate the other visual axes.
 */
export default {
  title: 'TextArea',
  render: (props) => (
    <TextArea
      testId="text-area"
      autocomplete="off"
      autocapitalize="sentences"
      enterkeyhint={undefined}
      placeholder="Message"
      {...props}
    />
  ),
  sections: [
    {
      title: 'Variant × State',
      rows: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
      columns: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
        { title: 'Read-only', props: { readOnly: true } },
      ],
    },
    {
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none', placeholder: 'none' } },
        { title: 'Small', props: { radius: 'small', placeholder: 'small' } },
        { title: 'Medium', props: { radius: 'medium', placeholder: 'medium' } },
        { title: 'Large', props: { radius: 'large', placeholder: 'large' } },
        { title: 'Full', props: { radius: 'full', placeholder: 'full' } },
      ],
    },
    {
      title: 'Resize',
      columns: [
        { title: 'None', props: { resize: 'none', placeholder: 'none' } },
        {
          title: 'Vertical',
          props: { resize: 'vertical', placeholder: 'vertical' },
        },
        {
          title: 'Horizontal',
          props: { resize: 'horizontal', placeholder: 'horizontal' },
        },
        { title: 'Both', props: { resize: 'both', placeholder: 'both' } },
      ],
    },
  ],
} satisfies GalleryListing<TextAreaProps>;
