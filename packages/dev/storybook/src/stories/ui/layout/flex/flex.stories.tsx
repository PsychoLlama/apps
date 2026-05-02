import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, type FlexProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { flexArgTypes } from '@lib/ui/props/flex';
import { swatches } from '../../../../swatch';
import { gallery } from '../../../../gallery';

const DIRECTIONS = ['row', 'row-reverse', 'column', 'column-reverse'] as const;
const ALIGNS = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
const JUSTIFIES = ['start', 'center', 'end', 'between'] as const;
const WRAPS = ['nowrap', 'wrap', 'wrap-reverse'] as const;
const GAPS = [1, 3, 5, 7] as const;

const meta = {
  title: 'UI/Layout/Flex',
  component: Flex,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: swatches(6),
  },
  argTypes: {
    ...boxArgTypes,
    ...flexArgTypes,
    skeleton: { table: { disable: true } },
  },
} satisfies Meta<FlexProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Direction',
      items: DIRECTIONS.map((direction) => (
        <Flex
          as="div"
          direction={direction}
          gap={2}
          style={{ width: '6rem', height: '6rem' }}
        >
          {swatches(3)}
        </Flex>
      )),
    },
    {
      title: 'Align',
      items: ALIGNS.map((align) => (
        <Flex
          as="div"
          align={align}
          gap={2}
          style={{ height: '5rem', width: '8rem' }}
        >
          {swatches(3)}
        </Flex>
      )),
    },
    {
      title: 'Justify',
      items: JUSTIFIES.map((justify) => (
        <Flex as="div" justify={justify} gap={2} style={{ width: '10rem' }}>
          {swatches(3)}
        </Flex>
      )),
    },
    {
      title: 'Wrap',
      items: WRAPS.map((wrap) => (
        <Flex as="div" wrap={wrap} gap={2} style={{ width: '8rem' }}>
          {swatches(6)}
        </Flex>
      )),
    },
    {
      title: 'Gap',
      items: GAPS.map((gap) => (
        <Flex as="div" gap={gap}>
          {swatches(3)}
        </Flex>
      )),
    },
  ],
});

export const Playground: Story = {};
