import type { GalleryListing } from '@dev/gallery';
import Card from './card';
import Heading from '../heading/heading';
import Text from '../text/text';

type CardVariant = 'surface' | 'classic' | 'ghost';
const VARIANTS = ['surface', 'classic', 'ghost'] as const;

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
  title: 'Card',
  render: (props) => (
    <Card as="div" variant={props.variant}>
      <Body title={props.variant ?? 'surface'} />
    </Card>
  ),
  sections: [
    {
      title: 'Variant',
      columns: VARIANTS.map((variant) => ({
        title: variant,
        props: { variant },
      })),
    },
  ],
} satisfies GalleryListing<{ variant?: CardVariant }>;
