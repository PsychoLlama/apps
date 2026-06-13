import type { GalleryListing } from '@dev/gallery';
import Card from './card';
import Heading from '../heading/heading';
import Text from '../text/text';

const VARIANTS = ['surface', 'classic', 'ghost'] as const;
const SIZES = [1, 2, 3, 4, 5] as const;

const Body = (props: { title: string }) => (
  <>
    <Heading as="h3" size={3} selectable>
      {props.title}
    </Heading>
    <Text as="p" size={2} selectable>
      Cards group related content into a single surface.
    </Text>
  </>
);

/**
 * Gallery listing for `Card`. Enumerates the component across its visual
 * axes.
 */
export default {
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Card as="div" variant={variant}>
          <Body title={variant} />
        </Card>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Card as="div" size={size}>
          <Body title={`Size ${size}`} />
        </Card>
      )),
    },
  ],
} satisfies GalleryListing;
