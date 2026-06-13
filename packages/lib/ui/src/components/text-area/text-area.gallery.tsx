import type { GalleryListing } from '@dev/gallery';
import TextArea from './text-area';

const VARIANTS = ['classic', 'surface', 'soft'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;
const RESIZES = ['none', 'vertical', 'horizontal', 'both'] as const;

const defaults = {
  testId: 'text-area',
  autocomplete: 'off',
  autocapitalize: 'sentences',
  enterkeyhint: undefined,
} as const;

/**
 * Gallery listing for `TextArea`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <TextArea {...defaults} variant={variant} placeholder={variant} />
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <TextArea {...defaults} size={size} placeholder={`Size ${size}`} />
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <TextArea {...defaults} radius={radius} placeholder={radius} />
      )),
    },
    {
      title: 'Resize',
      items: RESIZES.map((resize) => (
        <TextArea {...defaults} resize={resize} placeholder={resize} />
      )),
    },
    {
      title: 'State',
      items: [
        <TextArea {...defaults} placeholder="Default" />,
        <TextArea {...defaults} placeholder="Disabled" disabled />,
        <TextArea {...defaults} placeholder="Read-only" readOnly />,
      ],
    },
  ],
} satisfies GalleryListing;
