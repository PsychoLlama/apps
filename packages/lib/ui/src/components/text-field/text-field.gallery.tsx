import type { GalleryListing } from '@dev/gallery';
import IconMagnify from 'virtual:icons/mdi/magnify';
import IconClose from 'virtual:icons/mdi/close';
import TextField from './text-field';
import IconButton from '../icon-button/icon-button';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = {
  testId: 'text-field',
  autocomplete: 'off',
  autocapitalize: 'off',
  enterkeyhint: 'search',
} as const;

/**
 * Gallery listing for `TextField`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'TextField',
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <TextField
          {...defaults}
          variant={variant}
          placeholder={variant}
          left={<IconMagnify />}
        />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <TextField
          {...defaults}
          radius={radius}
          placeholder={radius}
          left={<IconMagnify />}
        />
      )),
    },
    {
      title: 'Slots',
      items: [
        <TextField {...defaults} placeholder="No slots" />,
        <TextField {...defaults} placeholder="Left" left={<IconMagnify />} />,
        <TextField
          {...defaults}
          placeholder="Right"
          right={
            <IconButton
              testId="text-field-clear"
              aria-label="Clear"
              size={1}
              variant="ghost"
              color="neutral"
            >
              <IconClose />
            </IconButton>
          }
        />,
        <TextField
          {...defaults}
          placeholder="Both"
          left={<IconMagnify />}
          right={
            <IconButton
              testId="text-field-clear"
              aria-label="Clear"
              size={1}
              variant="ghost"
              color="neutral"
            >
              <IconClose />
            </IconButton>
          }
        />,
      ],
    },
    {
      title: 'State',
      items: [
        <TextField
          {...defaults}
          placeholder="Default"
          left={<IconMagnify />}
        />,
        <TextField
          {...defaults}
          placeholder="Disabled"
          left={<IconMagnify />}
          disabled
        />,
        <TextField
          {...defaults}
          placeholder="Read-only"
          left={<IconMagnify />}
          readOnly
        />,
      ],
    },
  ],
} satisfies GalleryListing;
