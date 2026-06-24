import type { Listing } from '#gallery';
import TextArea, { type TextAreaProps } from './text-area';

/**
 * Gallery listing for `TextArea`. The headline view crosses variant (rows)
 * against input state; the remaining tabs enumerate the other visual axes.
 */
export default {
  title: 'TextArea',
  group: 'form',
  render: (props) => (
    <TextArea
      testId="text-area"
      autocomplete="off"
      autocapitalize="sentences"
      enterkeyhint={undefined}
      placeholder="Message"
      value="Message"
      {...props}
    />
  ),
  sections: [
    {
      title: 'Variant',
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
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
    {
      title: 'Resize',
      columns: [
        { title: 'None', props: { resize: 'none' } },
        {
          title: 'Vertical',
          props: { resize: 'vertical' },
        },
        {
          title: 'Horizontal',
          props: { resize: 'horizontal' },
        },
        { title: 'Both', props: { resize: 'both' } },
      ],
    },
  ],
} satisfies Listing<TextAreaProps>;
