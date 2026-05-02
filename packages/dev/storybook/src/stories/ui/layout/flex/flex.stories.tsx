import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex, type FlexProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { flexArgTypes } from '@lib/ui/props/flex';
import { swatches } from '../../../../swatch';

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

export const Playground: Story = {};
