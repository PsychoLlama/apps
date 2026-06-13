import type { GalleryListing } from '@dev/gallery';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import TextField, { type TextFieldProps } from './text-field';
import IconButton from '../icon-button/icon-button';

const ClearButton = () => (
  <IconButton
    testId="text-field-clear"
    aria-label="Clear"
    size={1}
    variant="ghost"
    color="neutral"
  >
    <IconClose />
  </IconButton>
);

/**
 * Gallery listing for `TextField`. The headline view crosses size against
 * radius; the remaining tabs enumerate the other visual axes.
 */
export default {
  title: 'TextField',
  render: (props) => (
    <TextField
      testId="text-field"
      autocomplete="off"
      autocapitalize="off"
      enterkeyhint="search"
      placeholder="Search"
      left={<IconMagnify />}
      {...props}
    />
  ),
  sections: [
    {
      title: 'Size × Radius',
      rows: [
        { title: 'Size 1', props: { size: 1 } },
        { title: 'Size 2', props: { size: 2 } },
        { title: 'Size 3', props: { size: 3 } },
      ],
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
    {
      title: 'Variant',
      columns: [
        {
          title: 'Classic',
          props: { variant: 'classic', placeholder: 'classic' },
        },
        {
          title: 'Surface',
          props: { variant: 'surface', placeholder: 'surface' },
        },
        { title: 'Soft', props: { variant: 'soft', placeholder: 'soft' } },
      ],
    },
    {
      title: 'Slots',
      columns: [
        { title: 'None', props: { left: undefined, placeholder: 'No slots' } },
        { title: 'Left', props: { placeholder: 'Left' } },
        {
          title: 'Right',
          props: {
            left: undefined,
            right: <ClearButton />,
            placeholder: 'Right',
          },
        },
        {
          title: 'Both',
          props: { right: <ClearButton />, placeholder: 'Both' },
        },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Default', props: { placeholder: 'Default' } },
        {
          title: 'Disabled',
          props: { disabled: true, placeholder: 'Disabled' },
        },
        {
          title: 'Read-only',
          props: { readOnly: true, placeholder: 'Read-only' },
        },
      ],
    },
  ],
} satisfies GalleryListing<TextFieldProps>;
