import type { GalleryListing } from '@dev/gallery';
import IconHeart from 'virtual:icons/mdi/heart';
import IconButton from './icon-button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = {
  'aria-label': 'Like',
  testId: 'icon-button',
} as const;

/**
 * Gallery listing for `IconButton`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <IconButton {...defaults} variant={variant}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <IconButton {...defaults} color={color}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <IconButton {...defaults} size={size}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => (
        <IconButton {...defaults} radius={radius}>
          <IconHeart />
        </IconButton>
      )),
    },
    {
      title: 'Disabled',
      items: VARIANTS.map((variant) => (
        <IconButton {...defaults} variant={variant} disabled>
          <IconHeart />
        </IconButton>
      )),
    },
  ],
} satisfies GalleryListing;
