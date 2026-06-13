import { Show } from 'solid-js';
import type { GalleryListing } from '@dev/gallery';
import Separator, { type SeparatorProps } from './separator';
import Flex from '../flex/flex';
import Text from '../text/text';
import * as css from './separator.gallery.css';

const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;

/** Renders a separator between two labels, oriented by `props.orientation`. */
const Demo = (props: Partial<SeparatorProps>) => (
  <Show
    when={props.orientation === 'vertical'}
    fallback={
      <Flex as="div" direction="column" gap={2} class={css.horizontalCell}>
        <Text as="span" size={1} selectable={false}>
          Above
        </Text>
        <Separator decorative {...props} orientation="horizontal" />
        <Text as="span" size={1} selectable={false}>
          Below
        </Text>
      </Flex>
    }
  >
    <Flex as="div" align="center" gap={2} class={css.verticalCell}>
      <Text as="span" size={1} selectable={false}>
        Left
      </Text>
      <Separator decorative {...props} orientation="vertical" />
      <Text as="span" size={1} selectable={false}>
        Right
      </Text>
    </Flex>
  </Show>
);

/**
 * Gallery listing for `Separator`. Enumerates the component across its
 * visual axes.
 */
export default {
  title: 'Separator',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Orientation',
      columns: [
        { title: 'Horizontal', props: { orientation: 'horizontal' } },
        { title: 'Vertical', props: { orientation: 'vertical' } },
      ],
    },
    {
      title: 'Color',
      columns: COLORS.map((color) => ({
        title: color,
        props: { color, size: 2 },
      })),
    },
  ],
} satisfies GalleryListing<SeparatorProps>;
