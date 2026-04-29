import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { Flex as FlexComponent, type FlexProps } from '@lib/ui';
import { boxArgTypes } from '@lib/ui/props/box';
import { flexArgTypes } from '@lib/ui/props/flex';
import { skeletonArgs } from '@lib/ui/props/skeleton';
import { swatches } from '../../../swatch';

const meta = {
  title: 'UI/Layout',
  component: FlexComponent,
  args: {
    as: 'div',
    direction: 'row',
    gap: 3,
    children: swatches(6),
    ...skeletonArgs,
  },
  argTypes: {
    ...boxArgTypes,
    ...flexArgTypes,
  },
} satisfies Meta<FlexProps<'div'>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flex: Story = {};
