import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { type FlexProps } from './flex';
import FlexComponent from './flex';
import { boxArgTypes } from '../box/box.stories';
import { flexArgTypes } from '../../props/flex';
import { swatches } from '../../storybook/swatch';

const meta = {
  title: 'UI/Layout',
  component: FlexComponent,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: swatches(6),
  },
  argTypes: {
    ...boxArgTypes,
    ...flexArgTypes,
  },
} satisfies Meta<FlexProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flex: Story = {};
