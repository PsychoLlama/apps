import type { GalleryListing } from '@dev/gallery';
import Code from './code';
import Text from '../text/text';

const VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Gallery listing for `Code`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Code variant={variant}>{variant}</Code>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => <Code color={color}>{color}</Code>),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Code size={size}>size {size}</Code>),
    },
    {
      title: 'Inheriting size',
      items: SIZES.map((size) => (
        <Text as="p" size={size} selectable>
          Run <Code>npm install</Code> to get started.
        </Text>
      )),
    },
  ],
} satisfies GalleryListing;
