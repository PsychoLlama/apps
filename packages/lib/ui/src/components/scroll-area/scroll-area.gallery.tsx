import type { GalleryListing } from '@dev/gallery';
import ScrollArea, { type ScrollAreaProps } from './scroll-area';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './scroll-area.gallery.css';

const TYPES = ['auto', 'always', 'hover', 'scroll'] as const;
const SIZES = [1, 2, 3] as const;
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

const Demo = (props: Partial<ScrollAreaProps>) => (
  <Flex as="div" class={css.galleryCell}>
    <ScrollArea {...props}>
      <TallContent />
    </ScrollArea>
  </Flex>
);

/**
 * Gallery listing for `ScrollArea`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Type',
      items: TYPES.map((type) => <Demo type={type} />),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => <Demo size={size} />),
    },
    {
      title: 'Radius',
      items: RADII.map((radius) => <Demo radius={radius} />),
    },
    {
      title: 'Scrollbars',
      items: [
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea scrollbars="vertical">
            <TallContent />
          </ScrollArea>
        </Flex>,
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea scrollbars="horizontal">
            <WideContent />
          </ScrollArea>
        </Flex>,
        <Flex as="div" class={css.galleryCell}>
          <ScrollArea scrollbars="both">
            <BothContent />
          </ScrollArea>
        </Flex>,
      ],
    },
  ],
} satisfies GalleryListing;
