import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import TextField from './text-field';
import IconButton from '../icon-button/icon-button';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const SIZES = [1, 2, 3] as const;

const DEFAULTS = {
  testId: 'text-field',
  autocomplete: 'off',
  autocapitalize: 'off',
  enterkeyhint: 'search',
} as const;

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
      {...DEFAULTS}
      placeholder="Search"
      left={<IconMagnify />}
      {...props}
    />
  ),
  sections: [
    {
      title: 'Size × Radius',
      rows: SIZES.map((size) => ({ title: `Size ${size}`, props: { size } })),
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
    },
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, placeholder: variant },
      })),
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
} satisfies GalleryListing<ComponentProps<typeof TextField>>;
