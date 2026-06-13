import type { GalleryListing } from '@dev/gallery';
import Button, { type ButtonProps } from './button';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

/**
 * Gallery listing for `Button`. Enumerates the component across its visual
 * axes. `ButtonProps` is a union over `as`; pin the `<button>` arm so
 * `Partial<P>` keeps the full prop set.
 */
export default {
  title: 'Button',
  render: (props) => <Button as="button" testId="button" {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, children: variant },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, children: color },
      })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({
        title: radius,
        props: { radius, children: radius },
      })),
    },
    {
      title: 'Disabled',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, disabled: true, children: variant },
      })),
    },
  ],
} satisfies GalleryListing<Extract<ButtonProps, { as?: 'button' }>>;
