import type { GalleryListing } from '@dev/gallery';
import Separator, { type SeparatorProps } from './separator';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './separator.gallery.css';

const SIZES = [1, 2, 3, 4] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

const horizontal = (
  props: Omit<SeparatorProps, 'orientation' | 'decorative'>,
) => (
  <Flex as="div" direction="column" gap={2} class={css.horizontalCell}>
    <Text as="span" size={1} selectable={false}>
      Above
    </Text>
    <Separator orientation="horizontal" decorative {...props} />
    <Text as="span" size={1} selectable={false}>
      Below
    </Text>
  </Flex>
);

const vertical = (
  props: Omit<SeparatorProps, 'orientation' | 'decorative'>,
) => (
  <Flex as="div" align="center" gap={2} class={css.verticalCell}>
    <Text as="span" size={1} selectable={false}>
      Left
    </Text>
    <Separator orientation="vertical" decorative {...props} />
    <Text as="span" size={1} selectable={false}>
      Right
    </Text>
  </Flex>
);

/**
 * Gallery listing for `Separator`. Enumerates the component across its
 * visual axes.
 */
export default {
  sections: [
    {
      title: 'Orientation',
      items: [horizontal({}), vertical({})],
    },
    {
      title: 'Size',
      items: SIZES.map((size) => horizontal({ size })),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => horizontal({ color, size: 2 })),
    },
  ],
} satisfies GalleryListing;
