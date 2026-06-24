import type { Listing } from '#gallery';
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
 * Gallery listing for `TextField`. The headline view crosses variant (rows)
 * against radius; size and the remaining axes get their own tabs.
 */
export default {
  title: 'TextField',
  group: 'form',
  render: (props) => (
    <TextField
      testId="text-field"
      autocomplete="off"
      autocapitalize="off"
      enterkeyhint="search"
      placeholder="Search"
      value="Search"
      left={<IconMagnify />}
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
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
    {
      title: 'Size',
      columns: [
        { title: 'Size 1', props: { size: 1 } },
        { title: 'Size 2', props: { size: 2 } },
        { title: 'Size 3', props: { size: 3 } },
      ],
    },
    {
      title: 'Slots',
      columns: [
        { title: 'None', props: { left: undefined } },
        { title: 'Left', props: {} },
        {
          title: 'Right',
          props: {
            left: undefined,
            // Getter, not an eager `<ClearButton />`: the listing object is
            // built at module load, outside any reactive root. Deferring
            // creation until the prop is read lets it happen inside
            // `TextField`'s owner, so the slot's computations get disposed.
            get right() {
              return <ClearButton />;
            },
          },
        },
        {
          title: 'Both',
          props: {
            get right() {
              return <ClearButton />;
            },
          },
        },
      ],
    },
    {
      title: 'State',
      columns: [
        { title: 'Default', props: {} },
        {
          title: 'Disabled',
          props: { disabled: true },
        },
        {
          title: 'Read-only',
          props: { readOnly: true },
        },
      ],
    },
  ],
} satisfies Listing<TextFieldProps>;
