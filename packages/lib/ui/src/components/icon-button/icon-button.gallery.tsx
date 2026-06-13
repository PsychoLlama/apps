import type { GalleryListing } from '@dev/gallery';
import IconHeart from 'virtual:icons/mdi/heart';
import IconButton, { type IconButtonProps } from './icon-button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

/**
 * Gallery listing for `IconButton`. Enumerates the component across its
 * visual axes. `IconButtonProps` is a union over its labelling props; pin the
 * `aria-label` arm so `Partial<P>` keeps the full prop set.
 */
export default {
  title: 'IconButton',
  render: (props) => (
    <IconButton aria-label="Like" testId="icon-button" {...props}>
      <IconHeart />
    </IconButton>
  ),
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({ title: color, props: { color } })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
    },
    {
      title: 'Disabled',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, disabled: true },
      })),
    },
  ],
} satisfies GalleryListing<Extract<IconButtonProps, { 'aria-label': string }>>;
