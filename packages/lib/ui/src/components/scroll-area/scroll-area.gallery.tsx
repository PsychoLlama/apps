import type { GalleryListing } from '@dev/gallery';
import ScrollArea, { type ScrollAreaProps } from './scroll-area';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './scroll-area.gallery.css';

const TYPES = ['auto', 'always', 'hover', 'scroll'] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const TallContent = () => (
  <Flex as="div" direction="column" class={css.tallContent}>
    {Array.from({ length: 20 }, (_unused, index) => (
      <Text as="p" selectable>
        Line {index + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Text>
    ))}
  </Flex>
);

const WideContent = () => (
  <Flex as="div" class={css.wideContent}>
    <Text as="p" selectable>
      A single very wide paragraph that overflows the viewport horizontally —
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </Text>
  </Flex>
);

const BothContent = () => (
  <Flex as="div" direction="column" class={css.bothContent}>
    {Array.from({ length: 20 }, (_unused, index) => (
      <Text as="p" selectable>
        Row {index + 1} — Lorem ipsum dolor sit amet, consectetur adipiscing
        elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam.
      </Text>
    ))}
  </Flex>
);

// Horizontal/both scrollbars need content that overflows on that axis.
const contentFor = (scrollbars: ScrollAreaProps['scrollbars']) => {
  if (scrollbars === 'horizontal') return <WideContent />;
  if (scrollbars === 'both') return <BothContent />;
  return <TallContent />;
};

/**
 * Gallery listing for `ScrollArea`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'ScrollArea',
  render: (props) => (
    <Flex as="div" class={css.galleryCell}>
      <ScrollArea {...props}>{contentFor(props.scrollbars)}</ScrollArea>
    </Flex>
  ),
  sections: [
    {
      title: 'Type',
      columns: TYPES.map((type) => ({ title: type, props: { type } })),
    },
    {
      title: 'Radius',
      columns: RADII.map((radius) => ({ title: radius, props: { radius } })),
    },
    {
      title: 'Scrollbars',
      columns: [
        { title: 'Vertical', props: { scrollbars: 'vertical' } },
        { title: 'Horizontal', props: { scrollbars: 'horizontal' } },
        { title: 'Both', props: { scrollbars: 'both' } },
      ],
    },
  ],
} satisfies GalleryListing<ScrollAreaProps>;
