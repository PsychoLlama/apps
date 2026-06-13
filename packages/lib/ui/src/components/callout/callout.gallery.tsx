import type { GalleryListing } from '@dev/gallery';
import Callout from './callout';
import Text from '../text/text';

const VARIANTS = ['soft', 'surface', 'outline'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3] as const;

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
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Callout variant={variant}>
          <Body label={`${variant} callout`} />
        </Callout>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Callout color={color}>
          <Body label={`${color} callout`} />
        </Callout>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Callout size={size}>
          <Body label={`Size ${size}`} />
        </Callout>
      )),
    },
    {
      title: 'High contrast',
      items: VARIANTS.map((variant) => (
        <Callout variant={variant} highContrast>
          <Body label={`${variant} callout`} />
        </Callout>
      )),
    },
  ],
} satisfies GalleryListing;
