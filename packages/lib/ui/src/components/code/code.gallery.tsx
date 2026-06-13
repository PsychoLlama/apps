import type { GalleryListing } from '@dev/gallery';
import Code from './code';
import Text from '../text/text';

const VARIANTS = ['solid', 'soft', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

/**
 * Gallery listing for `Code`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Code',
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
      title: 'In context',
      items: [
        <Text as="p" selectable>
          Run <Code>npm install</Code> to get started.
        </Text>,
      ],
    },
  ],
} satisfies GalleryListing;
