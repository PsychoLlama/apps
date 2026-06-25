import type { Listing } from '#gallery';
import Flex, { type FlexProps } from './flex';
import * as css from './flex.gallery.css';

/** Renders a bounded flex container of three numbered tiles. */
const Demo = (props: Partial<FlexProps<'div'>>) => (
  <Flex as="div" gap={2} {...props} class={css.container}>
    <span class={css.tile}>1</span>
    <span class={css.tile}>2</span>
    <span class={css.tile}>3</span>
  </Flex>
);

/**
 * Gallery listing for `Flex`. Enumerates the container across its layout
 * axes — direction, cross-axis alignment, main-axis distribution, and gap.
 */
export default {
  title: 'Flex',
  group: 'layout',
  render: (props) => <Demo {...props} />,
  sections: [
    {
      title: 'Direction',
      columns: [
        { title: 'Row', props: { direction: 'row' } },
        { title: 'Column', props: { direction: 'column' } },
        { title: 'Row reverse', props: { direction: 'row-reverse' } },
        { title: 'Column reverse', props: { direction: 'column-reverse' } },
      ],
    },
    {
      title: 'Alignment',
      columns: [
        { title: 'Start', props: { align: 'start' } },
        { title: 'Center', props: { align: 'center' } },
        { title: 'End', props: { align: 'end' } },
        { title: 'Stretch', props: { align: 'stretch' } },
        { title: 'Baseline', props: { align: 'baseline' } },
      ],
    },
    {
      title: 'Justify',
      columns: [
        { title: 'Start', props: { justify: 'start' } },
        { title: 'Center', props: { justify: 'center' } },
        { title: 'End', props: { justify: 'end' } },
        { title: 'Between', props: { justify: 'between' } },
      ],
    },
    {
      title: 'Gap',
      align: { columns: 'center' },
      columns: [
        { title: '1', props: { gap: 1 } },
        { title: '3', props: { gap: 3 } },
        { title: '5', props: { gap: 5 } },
      ],
    },
  ],
} satisfies Listing<FlexProps<'div'>>;
