import type { ComponentProps } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Callout from './callout';
import Text from '../text/text';

const VARIANTS = ['soft', 'surface', 'outline'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

const Body = (props: { label: string }) => (
  <Text as="p" size={2} selectable>
    {props.label}
  </Text>
);

/**
 * Gallery listing for `Callout`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Callout',
  render: (props) => <Callout {...props} />,
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant, children: <Body label={`${variant} callout`} /> },
      })),
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, children: <Body label={`${color} callout`} /> },
      })),
    },
    {
      title: 'High contrast',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: {
          variant,
          highContrast: true,
          children: <Body label={`${variant} callout`} />,
        },
      })),
    },
  ],
} satisfies GalleryListing<ComponentProps<typeof Callout>>;
