import type { GalleryListing } from '@dev/gallery';
import Badge from './badge';

const VARIANTS = ['solid', 'soft', 'surface', 'outline'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

/**
 * Gallery listing for `Badge`. Enumerates the component across its visual
 * axes — mirrors the Storybook `Overview` story.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Badge variant={variant}>{variant}</Badge>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Badge color={color}>{color}</Badge>),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Badge size={size}>Size {size}</Badge>),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Badge radius={radius}>{radius}</Badge>),
    },
    {
      title: 'High contrast',
      items: VARIANTS.map((variant) => (
        <Badge variant={variant} highContrast>
          {variant}
        </Badge>
      )),
    },
  ],
} satisfies GalleryListing;
