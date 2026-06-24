import type { Listing } from '#gallery';
import Card, { type CardProps } from './card';
import Heading from '../heading/heading';
import Text from '../text/text';

const Body = () => (
  <>
    <Heading as="h3" size={3} selectable>
      Getting started
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
  group: 'display',
  render: (props) => (
    <Card as="div" variant={props.variant}>
      <Body />
    </Card>
  ),
  sections: [
    {
      title: 'Variant',
      rows: [
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
      ],
    },
  ],
} satisfies Listing<CardProps<'div'>>;
