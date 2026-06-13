import type { GalleryListing } from '@dev/gallery';
import Button from './button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = { as: 'button', testId: 'button' } as const;

/**
 * Gallery listing for `Button`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Button {...defaults} variant={variant}>
          {variant}
        </Button>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Button {...defaults} color={color}>
          {color}
        </Button>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Button {...defaults} size={size}>
          Size {size}
        </Button>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <Button {...defaults} radius={radius}>
          {radius}
        </Button>
      )),
    },
    {
      title: 'Disabled',
      items: VARIANTS.map((variant) => (
        <Button {...defaults} variant={variant} disabled>
          {variant}
        </Button>
      )),
    },
  ],
} satisfies GalleryListing;
