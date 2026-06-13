import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import TextArea from './text-area';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const RESIZES = ['none', 'vertical', 'horizontal', 'both'] as const;

const DEFAULTS = {
  testId: 'text-area',
  autocomplete: 'off',
  autocapitalize: 'sentences',
  enterkeyhint: undefined,
} as const;

/**
 * Gallery listing for `TextArea`. The headline view crosses variant against
 * input state; the remaining tabs enumerate the other visual axes.
 */
export default {
  title: 'TextArea',
  render: (props) => (
    <TextArea {...DEFAULTS} placeholder="Message" {...props} />
  ),
  sections: [
    {
      title: 'Variant × State',
      rows: VARIANTS.map((variant) => ({ title: variant, props: { variant } })),
      columns: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
        { title: 'Read-only', props: { readOnly: true } },
      ],
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({
        title: radius,
        props: { radius, placeholder: radius },
      })),
    },
    {
      title: 'Resize',
      columns: RESIZES.map((resize) => ({
        title: resize,
        props: { resize, placeholder: resize },
      })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof TextArea>>;
