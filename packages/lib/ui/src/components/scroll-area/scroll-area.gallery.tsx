import type { Listing } from '#gallery';
import ScrollArea, { type ScrollAreaProps } from './scroll-area';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './scroll-area.gallery.css';

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
  group: 'display',
  render: (props) => (
    <Flex as="div" class={css.galleryCell}>
      <ScrollArea {...props}>{contentFor(props.scrollbars)}</ScrollArea>
    </Flex>
  ),
  sections: [
    {
      title: 'Type',
      columns: [
        { title: 'Auto', props: { type: 'auto' } },
        { title: 'Always', props: { type: 'always' } },
        { title: 'Hover', props: { type: 'hover' } },
        { title: 'Scroll', props: { type: 'scroll' } },
      ],
    },
    {
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
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
} satisfies Listing<ScrollAreaProps>;
