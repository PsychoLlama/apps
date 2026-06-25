import type { Listing } from '#gallery';
import Container, { type ContainerProps } from './container';
import * as css from './container.gallery.css';

/** Renders a capped column inside a bounded surface wider than every preset. */
const Demo = (props: Partial<ContainerProps<'div'>>) => (
  <Container as="div" {...props} class={css.frame}>
    <div class={css.column} />
  </Container>
);

/**
 * Gallery listing for `Container`. Enumerates the max-width caps and the
 * horizontal alignment of the capped column within its available space. Rows
 * keep each wide surface on its own line so the grid scrolls once, not per
 * permutation.
 */
export default {
  title: 'Container',
  group: 'layout',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Size',
      rows: [
        { title: '1', props: { size: 1 } },
        { title: '2', props: { size: 2 } },
        { title: '3', props: { size: 3 } },
        { title: '4', props: { size: 4 } },
      ],
    },
    {
      title: 'Alignment',
      rows: [
        { title: 'Start', props: { align: 'start', size: 2 } },
        { title: 'Center', props: { align: 'center', size: 2 } },
        { title: 'End', props: { align: 'end', size: 2 } },
      ],
    },
  ],
} satisfies Listing<ContainerProps<'div'>>;
